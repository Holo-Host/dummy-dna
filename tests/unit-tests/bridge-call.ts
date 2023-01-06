import test from 'tape-promise/tape.js';
import { runScenario, Scenario } from '@holochain/tryorama';
import { installAgents } from './utils.js';

test('bridge call', async (t) => {
	await runScenario(async (scenario: Scenario) => {
		const signals: any[] = [];

		const [alicePlayer] = await installAgents({
			scenario,
			number_of_agents: 1,
		});
		const [cell1, cell2] = alicePlayer.cells;
		const signalHandler = (signal: any) => {
			signals.push(signal);
		};
		await alicePlayer.conductor.appWs().on('signal', signalHandler);

		const payload = { value: 'moosetown' };
		await cell1.callZome({
			zome_name: 'test',
			fn_name: 'emit_signal_from_sibling_cell',
			payload: { sibling: cell2.cell_id, ...payload },
		});

		t.deepEqual(signals, [
			{
				type: 'signal',
				data: {
					cellId: cell2.cell_id,
					payload,
				},
			},
		]);
	});
});
