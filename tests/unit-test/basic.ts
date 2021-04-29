import path = require('path')
import * as _ from 'lodash'
import { localConductorConfig, installAgents, MEM_PROOF_BAD_SIG } from './utils'


module.exports = async (orchestrator) => {
  orchestrator.registerScenario('bad membrane proof', async (s, t) => {
    const [conductor] = await s.players([localConductorConfig])

    let appInstallFailed;
    try{
      await installAgents(conductor,  ["alice"], MEM_PROOF_BAD_SIG)
      appInstallFailed = false
      console.error('Error: App intallation passed genesis with an invalid proof.')
      t.fail()
    } catch(e) {
      appInstallFailed = true
      console.log(">>>>>>>>>>>> installAppResult",  e);
      t.deepEqual(e, {
        type: 'error',
        data: {
          type: 'internal_error',
          data: 'Conductor returned an error while using a ConductorApi: GenesisFailed { errors: [ConductorApiError(WorkflowError(GenesisFailure("Joining code invalid: unable to deserialize into element (Deserialize(\\"invalid type: map, expected a string\\"))")))] }'
        }
      });
    }
    t.ok(appInstallFailed)
  })
}
