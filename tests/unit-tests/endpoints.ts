import { inspect } from 'util'
import test from 'tape-promise/tape.js'
import { runScenario, Scenario } from '@holochain/tryorama'
import { Codec } from '@holo-host/cryptolib'
import { installAgents } from './utils.js'
import * as msgpack from '@msgpack/msgpack'

test('basic app functions', async (t) => {
	await runScenario(async (scenario: Scenario) => {
		const [alicePlayer] = await installAgents({ scenario, number_of_agents: 1 })
		const [alice] = alicePlayer.cells

		let response
		try {
			response = await alice.callZome({
				zome_name: 'test',
				fn_name: 'returns_obj',
				payload: null,
			})
			t.ok(response)
			t.deepEqual(response, { value: 'This is the returned value' })
		} catch (e) {
			console.error('Error: ', inspect(e))
			t.fail()
		}

		// test fn: pass_obj()
		try {
			response = await alice.callZome({
				zome_name: 'test',
				fn_name: 'pass_obj',
				payload: { value: 'The value passed to pass_obj' },
			})
			console.log('pass_obj response:', response)
			t.ok(response)
			t.deepEqual(response, { value: 'The value passed to pass_obj' })
		} catch (e) {
			console.error('Error: ', inspect(e))
			t.fail()
		}

		// test fn: return_failure()
		try {
			response = await alice.callZome({
				zome_name: 'test',
				fn_name: 'return_failure',
				payload: null,
			})
		} catch (e) {
			console.log('return_failure response:', e)
			t.deepEqual(e, {
				type: 'error',
				data: {
					type: 'ribosome_error',
					data: 'Wasm runtime error while working with Ribosome: RuntimeError: WasmError { file: "zomes/test/src/lib.rs", line: 62, error: Deserialize([192]) }',
				},
			})
			t.pass()
		}

		let link_hash_1, link_hash_2, link_hash_3
		try {
			link_hash_1 = await alice.callZome({
				zome_name: 'test',
				fn_name: 'create_link',
				payload: null,
			})
			console.log('create_link response:', link_hash_1)
			t.ok(link_hash_1)
			// confirm response is action hash
			let holohash = Codec.HoloHash.encode('header', link_hash_1)
			t.equal(holohash.substring(0, 5), 'uhCkk')

			link_hash_2 = await alice.callZome({
				zome_name: 'test',
				fn_name: 'create_link',
				payload: null,
			})
			console.log('create_link response:', link_hash_2)
			t.ok(link_hash_2)
			// confirm response is action hash
			holohash = Codec.HoloHash.encode('header', link_hash_2)
			t.equal(holohash.substring(0, 5), 'uhCkk')

			link_hash_3 = await alice.callZome({
				zome_name: 'test',
				fn_name: 'create_link',
				payload: null,
			})
			console.log('create_link response:', link_hash_3)
			t.ok(link_hash_3)
			// confirm response is action hash
			holohash = Codec.HoloHash.encode('header', link_hash_3)
			t.equal(holohash.substring(0, 5), 'uhCkk')
		} catch (e) {
			console.error('Error: ', e)
			t.fail()
		}

		let list_response: any[]

		// test fn: get_links()
		try {
			list_response = await alice.callZome({
				zome_name: 'test',
				fn_name: 'get_links',
				payload: null,
			})
			console.log('get_links response', list_response)
			t.ok(list_response)
			t.equal(list_response.length, 3)
			t.deepEqual(list_response[0].create_link_hash, link_hash_1)
			t.deepEqual(list_response[1].create_link_hash, link_hash_2)
			t.deepEqual(list_response[2].create_link_hash, link_hash_3)
		} catch (e) {
			console.error('Error: ', e)
			t.fail()
		}

		// test fn: delete_link()
		try {
			response = await alice.callZome({
				zome_name: 'test',
				fn_name: 'delete_link',
				payload: link_hash_2,
			})
			console.log('delete_link response', response)
			t.ok(response)

			list_response = await alice.callZome({
				zome_name: 'test',
				fn_name: 'get_links',
				payload: null,
			})
			console.log('get_links response', list_response)
			t.ok(list_response)
			t.equal(list_response.length, 2)
			t.deepEqual(list_response[0].create_link_hash, link_hash_1)
			t.deepEqual(list_response[1].create_link_hash, link_hash_3)
		} catch (e) {
			console.error('Error: ', e)
			t.fail()
		}

		// test fn: delete_all_links()
		try {
			response = await alice.callZome({
				zome_name: 'test',
				fn_name: 'delete_all_links',
				payload: null,
			})
			console.log('delete_all_links response', response)
			t.equal(response, null)

			list_response = await alice.callZome({
				zome_name: 'test',
				fn_name: 'get_links',
				payload: null,
			})
			console.log('get_links response', list_response)
			t.ok(list_response)
			t.equal(list_response.length, 0)
		} catch (e) {
			console.error('Error: ', e)
			t.fail()
		}

		// test fn: create_public_entry()
		try {
			const initialState = await alicePlayer.conductor.adminWs().dumpState({ cell_id: alice.cell_id } )
			const publicEntryTestValue = { value: 'create_public_entry value' }
			const publicActionHash = await alice.callZome({
				zome_name: 'test',
				fn_name: 'create_public_entry',
				payload: publicEntryTestValue,
			})
			t.ok(publicActionHash)

			const afterCreatePublicState = await alicePlayer.conductor.adminWs().dumpState({ cell_id: alice.cell_id } )
			t.equal(afterCreatePublicState[0].source_chain_dump.records.length - initialState[0].source_chain_dump.records.length, 1)
			const publicEntry = afterCreatePublicState[0].source_chain_dump.records[afterCreatePublicState[0].source_chain_dump.records.length -1].entry.entry
			const decodedPublicEntry:any = msgpack.decode(publicEntry)
			t.equal(decodedPublicEntry.value, publicEntryTestValue.value)
		} catch (e) {
			console.error('Error: ', e)
			t.fail()
		}
		
		// test fn: create_private_entry()
		try {
			const initialState = await alicePlayer.conductor.adminWs().dumpState({ cell_id: alice.cell_id } )
			const privateEntryTestValue = { value: 'create_private_entry value' }
			const privateActionHash = await alice.callZome({
				zome_name: 'test',
				fn_name: 'create_private_entry',
				payload: privateEntryTestValue,
			})
			t.ok(privateActionHash)

			const afterCreatePrivateState = await alicePlayer.conductor.adminWs().dumpState({ cell_id: alice.cell_id } )
			t.equal(afterCreatePrivateState[0].source_chain_dump.records.length - initialState[0].source_chain_dump.records.length, 1)
			const privateEntry = afterCreatePrivateState[0].source_chain_dump.records[afterCreatePrivateState[0].source_chain_dump.records.length -1].entry.entry
			const decodedPrivateEntry:any = msgpack.decode(privateEntry)
			t.equal(decodedPrivateEntry.value, privateEntryTestValue.value)
		} catch (e) {
			console.error('Error: ', e)
			t.fail()
		}		
	})
})
