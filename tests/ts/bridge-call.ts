import test from "tape-promise/tape.js"
import { runScenario, Scenario } from '@holochain/tryorama'
import { installAgents, INVALID_JOINING_CODE } from './utils.js'

test("bridge call", async t => {
  await runScenario(async (scenario: Scenario) => {
    const signals: any[] = []

    const [alicePlayer] = await installAgents({ 
      scenario, 
      number_of_agents: 1, 
      signalHandler: (signal: any) => signals.push(signal) 
    })
    const [cell1, cell2] = alicePlayer.cells


    const payload = { value: 'moosetown' }
    await cell1.callZome({
      zome_name: 'test', 
      fn_name: 'emit_signal_from_sibling_cell', 
      payload: { sibling: cell2.cell_id, ...payload }
    })
    
    t.deepEqual(signals, [{
      type: 'Signal',
      data: {
        cellId: cell2.cell_id,
        payload
      }
    }])
  })
})
