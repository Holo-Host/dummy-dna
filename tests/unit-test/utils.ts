import { Orchestrator, Config, InstallAgentsHapps, InstalledHapp } from '@holochain/tryorama'
import * as msgpack from '@msgpack/msgpack';
import * as path from 'path'

export const delay = ms => new Promise(r => setTimeout(r, ms))
export const wait = ms => new Promise((r, j)=>setTimeout(r, ms))

export const localConductorConfig = Config.gen()

// Construct proper paths for your DNAs
export const testDna = path.join(__dirname, "../../test.dna")

// create an InstallAgentsHapps array with your DNAs to tell tryorama what
// to install into the conductor.
export const installation1agent: InstallAgentsHapps = [
  [[testDna]],
]
export const installation2agent: InstallAgentsHapps = [
  [[testDna]],
  [[testDna]],
]


const SUCCESSFUL_JOINING_CODE = Buffer.from((msgpack.encode('joining code') as Buffer).toString('base64'), 'base64')
// export const INVALID_JOINING_CODE = Buffer.from((msgpack.encode('failing joining code') as Buffer).toString('base64'), 'base64')
export const INVALID_JOINING_CODE = Buffer.from("3gACrXNpZ25lZF9oZWFkZXLeAAKmaGVhZGVy3gA", 'base64')

export const installAgents = async (conductor, agentNames, memProof?) => {
  const dnas = [
    {
      hash: await conductor.registerDna({path: testDna}),
      nick: 'elemental-chat',
      membrane_proof: Array.from(memProof || SUCCESSFUL_JOINING_CODE), // default to successful mem proof
      uid: conductor.scenarioUID,
    }
  ]
  const admin = conductor.adminWs();
  const agents: Array<InstalledHapp> = await Promise.all(agentNames.map(
  async agent => {
      const req = {
        installed_app_id: `${agent}_chat`,
        agent_key: await admin.generateAgentPubKey(),
        dnas
      }
      return await conductor._installHapp(req)
    }
  ))
  return agents
}

