import path = require('path')
import * as _ from 'lodash'
import { localConductorConfig, installAgents, INVALID_JOINING_CODE } from './utils'


module.exports = async (orchestrator) => {
  orchestrator.registerScenario('bad membrane proof', async (s, t) => {
    const [conductor] = await s.players([localConductorConfig])

    let appInstallFailed;
    try {
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
}
