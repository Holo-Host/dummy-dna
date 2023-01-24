import test from 'tape-promise/tape.js';
import { runScenario, Scenario } from '@holochain/tryorama';
import { installAgents, installAgentsOnConductor } from './utils.js';
import { Codec } from '@holo-host/cryptolib';
import { inspect } from 'util';

test('basic cap grant', async (t) => {
	await runScenario(async (scenario: Scenario) => {
		let conductor = await scenario.addConductor();

		let [aliceHapp, bobHapp] = await installAgentsOnConductor({
			conductor,
			number_of_agents: 2,
		});

		const aliceCell = aliceHapp.cells.find((c) => c.name === 'test');
		const bobCell = bobHapp.cells.find((c) => c.name === 'test');

		const expected_private_function_result =
			'this is the result of the private function';

		// Bob can call his own private function
		const first_private_function_result = await bobCell.callZome({
			zome_name: 'test',
			fn_name: 'private_function',
			payload: null,
		});

		t.deepEqual(
			first_private_function_result,
			expected_private_function_result
		);

		// Should not be able to call Bobs private function with Alices provenance
		try {
			await bobCell.callZome({
				zome_name: 'test',
				fn_name: 'private_function',
				payload: null,
				provenance: aliceHapp.agentPubKey,
			});

			t.fail(
				'Should not be able to call Bobs private function with Alices provenance'
			);
		} catch (e) {
			t.deepEqual(e, {
				type: 'error',
				data: {
					type: 'zome_call_unauthorized',
					data: 'No capabilities grant has been committed that allows the CapSecret None to call the function private_function in zome test',
				},
			});
		}

		// Should not be able to call Bobs private function with Alices provenance and Alices cap secret
		const bad_secret = await aliceCell.callZome({
			zome_name: 'test',
			fn_name: 'create_cap_grant_for_private_function',
			payload: null,
		});

		try {
			await bobCell.callZome({
				zome_name: 'test',
				fn_name: 'private_function',
				payload: null,
				provenance: aliceHapp.agentPubKey,
				cap_secret: bad_secret,
			});

			t.fail(
				'Should not be able to call Bobs private function with Alices provenance'
			);
		} catch (e) {
			t.equal(e.type, 'error');
			t.equal(e.data.type, 'zome_call_unauthorized');
			t.match(
				e.data.data,
				/^No capabilities grant has been committed that allows the CapSecret/
			);
		}

		// SHOULD be able to call Bobs private function with Alices provenance and ALICES cap secret
		const cap_secret = await bobCell.callZome({
			zome_name: 'test',
			fn_name: 'create_cap_grant_for_private_function',
			payload: null,
		});

		const second_private_function_result = await bobCell.callZome({
			zome_name: 'test',
			fn_name: 'private_function',
			payload: null,
			provenance: aliceHapp.agentPubKey,
			cap_secret,
		});

		t.deepEqual(
			second_private_function_result,
			expected_private_function_result
		);
	});
});

test('cap grant remote calls', async (t) => {
	await runScenario(async (scenario: Scenario) => {
		const [alicePlayer, bobPlayer] = await installAgents({
			scenario,
			number_of_agents: 2,
		});

		const alice = alicePlayer.cells.find((cell) => cell.name === 'test');
		const bob = bobPlayer.cells.find((cell) => cell.name === 'test');

		if (!alice || !bob) {
			throw new Error('Failed to install expected cells');
		}

		await scenario.shareAllAgents();

		// create a cap grant and get the secret, from Alice. This won't let Alice make a call to Bob
		const bad_secret = await alice.callZome({
			zome_name: 'test',
			fn_name: 'create_cap_grant_for_private_function',
			payload: null,
		});

		try {
			await alice.callZome({
				zome_name: 'test',
				fn_name: 'remote_call_private_function',
				payload: {
					to_cell: bob.cell_id,
					cap_secret: bad_secret,
				},
			});

			t.fail(
				"alice shouldn't be able to call bobs remote function with a cap secret she created"
			);
		} catch (e) {
			t.deepEqual(e, {
				type: 'error',
				data: {
					type: 'ribosome_error',
					data: 'Wasm runtime error while working with Ribosome: RuntimeError: WasmError { file: "zomes/test/src/lib.rs", line: 158, error: CallError("Unauthorized call to private_function") }',
				},
			});
		}

		// create a cap grant and get the secret, from Bob. Alice can use this to succesfully call Bob
		const cap_secret = await bob.callZome({
			zome_name: 'test',
			fn_name: 'create_cap_grant_for_private_function',
			payload: null,
		});

		try {
			let private_function_result = await alice.callZome({
				zome_name: 'test',
				fn_name: 'remote_call_private_function',
				payload: {
					to_cell: bob.cell_id,
					cap_secret,
				},
			});
			t.deepEqual(
				private_function_result,
				'this is the result of the private function'
			);
		} catch (e) {
			console.log('e', inspect(e));
			t.fail(
				"alice couldn't call bobs remote function despite having a cap secret"
			);
		}
	});
});
