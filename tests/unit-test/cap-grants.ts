import { localConductorConfig, installAgents } from './utils'


module.exports = async (orchestrator) => {
  orchestrator.registerScenario('cap grants', async (s, t) => {
    const [conductor] = await s.players([localConductorConfig])
    const [aliceHapp, bobHapp] = await installAgents(conductor, ['alice', 'bob'])
    const [alice] = aliceHapp.cells
    const [bob] = bobHapp.cells

    // create a cap grant and get the secret, from Alice. This won't let Alice make a call to Bob
    const bad_secret = await alice.call('test', 'create_cap_grant_for_private_function', null)

    try {
      await alice.call('test', 'remote_call_private_function', { to_cell: bob.cellId, cap_secret: bad_secret })
      t.fail("alice shouldn't be able to call bobs remote function with a cap secret she created")
    } catch (e) {
      t.deepEqual(e, {
        type: 'error',
        data: {
          type: 'ribosome_error',
          data: 'Wasm error while working with Ribosome: CallError("Unauthorized call to private_function")'
        }
      })
    }

    // create a cap grant and get the secret, from Bob. Alice can use this to succesfully call Bob
    const cap_secret = await bob.call('test', 'create_cap_grant_for_private_function', null)

    try {
      let private_function_result = await alice.call('test', 'remote_call_private_function', { to_cell: bob.cellId, cap_secret })

      t.deepEqual(private_function_result, "this is the result of the private function")
    } catch (e) {
      console.log('e', e)
      t.fail()
    }
  })
}
