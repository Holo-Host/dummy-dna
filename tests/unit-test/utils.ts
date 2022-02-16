import {
  Config,
  InstalledHapp,
  Player
} from '@holochain/tryorama'
import * as msgpack from '@msgpack/msgpack'
import * as path from 'path'

export const localConductorConfig = Config.gen()

export const testHapp = path.join(__dirname, '../../test.happ')

const SUCCESSFUL_JOINING_CODE = msgpack.encode('joining code')
export const INVALID_JOINING_CODE = msgpack.encode('Failing Joining Code')

export const installAgents = async (
  conductor: Player,
  agentNames: string[],
  memProof?: Uint8Array
) => {
  const admin = conductor.adminWs()
  const agents: Array<InstalledHapp> = await Promise.all(
    agentNames.map(async agent => {
      const req = {
        installed_app_id: `${agent}_chat`,
        agent_key: await admin.generateAgentPubKey(),
        membrane_proofs: {
          test: Buffer.from(memProof ? memProof : SUCCESSFUL_JOINING_CODE),
          test2: Buffer.from(memProof ? memProof : SUCCESSFUL_JOINING_CODE),
        },
        uid: conductor.scenarioUID,
        path: testHapp
      }
      return await conductor._installBundledHapp(req)
    })
  )
  return agents
}
