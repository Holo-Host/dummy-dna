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

const SUCCESSFUL_JOINING_CODE = msgpack.encode('joining code')
export const INVALID_JOINING_CODE = msgpack.encode('Failing Joining Code')

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


export const consistency = async(cells) => {
  // 20 Seconds.
  const MAX_TIMEOUT = 1000 * 20;
  var total_published = 0;
  for (const cell of cells) {
        const dump = await cell.stateDump()
        const sdump = dump[0].source_chain_dump
        total_published += sdump.published_ops_count;
  }
  while (true) {
    var total_integrated = 0;
    var total_missing = 0;
    for (const cell of cells) {
      const dump = await cell.stateDump()
      console.log("integration dump was:", dump)
      const idump = dump[0].integration_dump
      if(idump.integrated >= total_published) {
        total_integrated += 1;
      } else {
        total_missing += total_published - idump.integrated;
      }
      console.log("Missing ", total_missing, "ops. Waiting 0.5 seconds for integration")
      await delay(500)
    }
    if(cells.length == total_integrated) {
      return;
    }
  }
}