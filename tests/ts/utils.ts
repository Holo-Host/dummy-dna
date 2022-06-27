import {
  Player,
  Scenario
} from '@holochain/tryorama'
import * as msgpack from '@msgpack/msgpack'
import path from 'path';
import {fileURLToPath} from 'url'
import { inspect } from 'util'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// export const localConductorConfig = Config.gen()

// export const testHapp = path.join(__dirname, '../../alternate-happ-configs/skip-proof/test-skip-proof.happ')
export const testHappPath = path.join(__dirname, '../../test.happ')

const SUCCESSFUL_JOINING_CODE = msgpack.encode('joining code')
export const INVALID_JOINING_CODE = msgpack.encode('Failing Joining Code')

type InstallAgentsArgs = {
  scenario: Scenario,
  number_of_agents: number,
  memProof?: Uint8Array,
  signalHandler?: any
}

export const installAgents = async ({
  scenario,
  number_of_agents,
  memProof,
  signalHandler
}: InstallAgentsArgs) => {
  const happBundleOptions = {
    membraneProofs: {
      test: Buffer.from(memProof ? memProof : SUCCESSFUL_JOINING_CODE),
      test2: Buffer.from(memProof ? memProof : SUCCESSFUL_JOINING_CODE),
    },
    signalHandler: signalHandler ? signalHandler : (_: any) => {}
  }

  let playersHappBundles = []

  for (let i = 0; i < number_of_agents; i++) {
    playersHappBundles.push({
      appBundleSource: { path: testHappPath },
      options: happBundleOptions
    })
  }

  let agents: Player[] = []  

  try {
    agents = await scenario.addPlayersWithHappBundles(playersHappBundles)
  } catch (e) {
    console.error('Error installing agents', inspect(e))
    throw e
  }

  return agents
}
