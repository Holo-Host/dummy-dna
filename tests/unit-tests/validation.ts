import test from "tape-promise/tape.js"
import { runScenario, Scenario } from '@holochain/tryorama'
import { installAgents, INVALID_JOINING_CODE } from './utils.js'

test("bad membrane proof", async t => {
  await runScenario(async (scenario: Scenario) => {
    try {
      const [_alicePlayer] = await installAgents({
        scenario, 
        number_of_agents: 1, 
        memProof: INVALID_JOINING_CODE
      })
      t.fail('App installation passed genesis with an invalid proof.')
    } catch (e) {
      t.deepEqual(e, {
        type: 'error',
        data: {
          type: 'internal_error',
          data: 'Conductor returned an error while using a ConductorApi: GenesisFailed { errors: [ConductorApiError(WorkflowError(GenesisFailure("Joining code invalid: passed failing string"))), ConductorApiError(WorkflowError(GenesisFailure("Joining code invalid: passed failing string")))] }'
        }
      });
    }  
  })
})
