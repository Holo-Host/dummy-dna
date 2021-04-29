import path = require('path')
import * as _ from 'lodash'
import { localConductorConfig, installAgents, INVALID_JOINING_CODE } from './utils'


module.exports = async (orchestrator) => {
  orchestrator.registerScenario('bad membrane proof', async (s, t) => {
    const [conductor] = await s.players([localConductorConfig])

    let appInstallFailed;
    try{
      await installAgents(conductor, ["alice"], INVALID_JOINING_CODE)
      appInstallFailed = false
      console.error('Error: App intallation passed genesis with an invalid proof.')
      t.fail()
    } catch(e) {
      appInstallFailed = true
      console.log("Install App Error: ",  e);
      t.deepEqual(e, {
        type: 'error',
        data: {
          type: 'internal_error',
          data: 'Conductor returned an error while using a ConductorApi: GenesisFailed { errors: [ConductorApiError(WorkflowError(GenesisFailure("Joining code invalid: passed failing string")))] }'
        }
      });
    }
    t.ok(appInstallFailed)
  })

  // orchestrator.registerScenario('basic app functions', async (s, t) => {
  //   // spawn the conductor process
  //   const [ conductor ] = await s.players([localConductorConfig])

  //   // test admin api endpoints: installation and activation
  //   let installResult
  //   try{
  //     installResult = await installAgents(conductor,  ["alice"])
  //     t.ok(installResult)
  //   } catch(e) {
  //     console.log("Error",  e)
  //     t.fail()
  //   }

  //   const [alice_test_happ] = installResult
  //   const [alice] = alice_test_happ.cells

  //   // test fn: returns_obj()
  //   let response_object;
  //   try{
  //     response_object = await alice.call('test', 'returns_obj', null);
  //     console.log("RESPONSE OBJECT:", response_object);
  //     t.ok(response_object)
  //     t.deep.equal(response_object, { value: "This is the returned value" })
  //   } catch(e) {
  //     console.error("Error: ", e);
  //     t.fail()
  //   }
  // })
}
