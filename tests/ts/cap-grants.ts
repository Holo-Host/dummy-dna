import test from "tape-promise/tape.js"
import { runScenario, Scenario } from '@holochain/tryorama'
import { installAgents } from './utils.js'
import { Codec } from '@holo-host/cryptolib'
import { inspect } from 'util'

const wait = (ms: number) => new Promise(resolve =>
  setTimeout(resolve, ms))

test("cap grants", async t => {
  await runScenario(async (scenario: Scenario) => {
    const [alicePlayer, bobPlayer] = await installAgents({ 
      scenario, 
      number_of_agents: 2, 
    }) 

    const alice = alicePlayer.cells.find(cell => cell.role_id === 'test')
    const bob = bobPlayer.cells.find(cell => cell.role_id === 'test')

    if (!alice || !bob) {
      throw new Error ('Failed to install expected cells')
    }

    console.log('alice', inspect(alice))
    console.log('bob', inspect(bob))
    console.log('alice id', Codec.AgentId.encode(alice.cell_id[1]))
    console.log('bob id', Codec.AgentId.encode(bob.cell_id[1]))    
    console.log('alice dna', Codec.HoloHash.encode('dna', alice.cell_id[0]))    
    console.log('bob dna', Codec.HoloHash.encode('dna', bob.cell_id[0]))    

    await scenario.shareAllAgents()

    await wait(1_000)

    // create a cap grant and get the secret, from Alice. This won't let Alice make a call to Bob
    const bad_secret = await alice.callZome({
      zome_name: 'test', 
      fn_name: 'create_cap_grant_for_private_function', 
      payload: null
    })

    try {
      await alice.callZome({
        zome_name: 'test', 
        fn_name: 'remote_call_private_function', 
        payload: { 
          to_cell: bob.cell_id, 
          cap_secret: bad_secret 
        }
      })      

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
    const cap_secret = await bob.callZome({
      zome_name: 'test', 
      fn_name: 'create_cap_grant_for_private_function', 
      payload: null
    })
    
    try {
      let private_function_result = await alice.callZome({
        zome_name: 'test', 
        fn_name: 'remote_call_private_function', 
        payload: { 
          to_cell: bob.cell_id, 
          cap_secret 
        }
      })
      t.deepEqual(private_function_result, "this is the result of the private function")
    } catch (e) {
      console.log('e', inspect(e))
      t.fail("alice couldn't call bobs remote function despite having a cap secret")
    }

  })
})
