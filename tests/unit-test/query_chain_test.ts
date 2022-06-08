import path = require('path')
import * as _ from 'lodash'
import { Codec } from '@holo-host/cryptolib'
import { localConductorConfig, installAgents } from './utils'

module.exports = async (orchestrator) => {
	orchestrator.registerScenario('basic app functions', async (s, t) => {
		// spawn the conductor process
		const [conductor] = await s.players([localConductorConfig])

		// test admin api endpoints: installation and activation
		let installResult
		try {
			installResult = await installAgents(conductor, ['alice', 'bobbo'])
			t.ok(installResult)
		} catch (e) {
			console.log('Error', e)
			t.fail()
		}

		const [alice_test_happ, bobbo_test_happ] = installResult
		const [alice] = alice_test_happ.cells
		const [bobbo] = bobbo_test_happ.cells

		const query = (agent) =>
			agent.call('test', 'query_my_chain_by_range', {
				from: 0,
				to: 100,
			})
		let response
		try {
			let alice_chain = await query(alice)
			console.log("Alice's Chain: ", alice_chain)
			let bobbo_chain = await query(bobbo)
			console.log("Bobbo's Chain: ", bobbo_chain)

			t.equal(alice_chain.length, 5)
			t.equal(bobbo_chain.length, 5)

			await alice.call('test', 'create_entry', null)

			await bobbo.call('test', 'create_entry', null)

			alice_chain = await query(alice)
			console.log("Alice's Chain: ", alice_chain)
			bobbo_chain = await query(bobbo)
			console.log("Bobbo's Chain: ", bobbo_chain)

			t.equal(alice_chain.length, 6)
			t.equal(bobbo_chain.length, 6)

			// This should be the entry that we just committed
			// Note alice_chain[2].entry is also showing as NotStored
			console.log('This is the entry I am trying to flag', alice_chain[5].entry)

			console.log('This is the entry I am trying to flag', bobbo_chain[5].entry)
			// This is mostly what I am expecting it to return
			t.ok(alice_chain[5].entry.Entry)
		} catch (e) {
			console.error('Error: ', e)
			t.fail()
		}
	})
}
