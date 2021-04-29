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

// this mem_proof is a signature of the `{role, record_locator}` payload signing  a holo public key
// The current holo_hosting pub key is `uhCAkfzycXcycd-OS6HQHvhTgeDVjlkFdE2-XHz-f_AC_5xelQX1N`
const MEM_PROOF = Buffer.from("3gACrXNpZ25lZF9oZWFkZXLeAAKmaGVhZGVy3gACp2NvbnRlbnTeAAekdHlwZaZDcmVhdGWmYXV0aG9yxCeEICR/PJxdzJx345LodAe+FOB4NWOWQV0Tb5cfP5/8AL/nF6VBfU2pdGltZXN0YW1wks5gUzqazhJyV9WqaGVhZGVyX3NlcQmrcHJldl9oZWFkZXLEJ4QpJEIwak+vC8awMx0vdAe8XSbRRage/CuXmCjRhkkTtWWAUUOp8qplbnRyeV90eXBl3gABo0FwcN4AA6JpZACnem9tZV9pZACqdmlzaWJpbGl0ed4AAaZQdWJsaWPAqmVudHJ5X2hhc2jEJ4QhJAf4ZKktdaQZ6JJj4l+UDRCTwspZSchRPYXtwbdRVvyQBnB8ZqRoYXNoxCeEKSSebKOWLx1D9uHxPBkzVjOgm3gtO6w8VkiiEvigSfgTeFWLVN+pc2lnbmF0dXJlxEC+3INgyz2PfsiwtpBpTZIcx0JYVy9t7rYp2HWnK5x9Vw/uITWUzfIO4uaNl6MQppfkraxHLeNZqamjyEtRWggApWVudHJ53gABp1ByZXNlbnTeAAKqZW50cnlfdHlwZaNBcHClZW50cnnEMoKkcm9sZalkZXZlbG9wZXKucmVjb3JkX2xvY2F0b3Kybmljb2xhc0BsdWNrc3VzLmV1", 'base64')
export const MEM_PROOF_BAD_SIG = Buffer.from("3gACrXNpZ25lZF9oZWFkZXLeAAKmaGVhZGVy3gACp2NvbnRlbnTeAAekdHlwZaZDcmVhdGWmYXV0aG9yxCeEICR/PJxdzJx345LodAe+FOB4NWOWQV0Tb5cfP5/8AL/nF6VBfU2pdGltZXN0YW1wks5gUzqazhJyV9WqaGVhZGVyX3NlcQmrcHJldl9oZWFkZXLEJ4QpJEIwak+vC8awMx0vdAe8XSbRRage/CuXmCjRhkkTtWWAUUOp8qplbnRyeV90eXBl3gABo0FwcN4AA6JpZACnem9tZV9pZACqdmlzaWJpbGl0ed4AAaZQdWJsaWPAqmVudHJ5X2hhc2jEJ4QhJAf4ZKktdaQZ6JJj4l+UDRCTwspZSchRPYXtwbdRVvyQBnB8ZqRoYXNoxCeEKSSebKOWLx1D9uHxPBkzVjOgm3gtO6w8VkiiEvigSfgTeFWLVN+pc2lnbmF0dXJlxEC+3INgyz2PfsiwtpBpTZIcx0JYVy9t7rYp2HWnK5x9Vw/uITWUzfIO4uaNl6MQppfkraxHLeNZqamjzEtRWggApWVudHJ53gABp1ByZXNlbnTeAAKqZW50cnlfdHlwZaNBcHClZW50cnnEMoKkcm9sZalkZXZlbG9wZXKucmVjb3JkX2xvY2F0b3Kybmljb2xhc0BsdWNrc3VzLmV1", 'base64')

export const installAgents = async (conductor, agentNames, memProof?) => {
  if (!memProof) {
    memProof = MEM_PROOF
  }
  const dnas = [
    {
      hash: await conductor.registerDna({path: testDna}),
      nick: 'elemental-chat',
      membrane_proof: Array.from(memProof),
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

