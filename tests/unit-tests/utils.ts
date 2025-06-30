import { Conductor, AppOptions, Player, Scenario, enableAndGetAgentApp } from '@holochain/tryorama'
import { AppBundleSource, AppSignal } from '@holochain/client'
import * as msgpack from '@msgpack/msgpack'
import path from 'path'
import { fileURLToPath } from 'url'
import { inspect } from 'util'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const testHappPath = path.join(__dirname, '../../test.happ')

const SUCCESSFUL_JOINING_CODE = msgpack.encode('joining code')
export const INVALID_JOINING_CODE = msgpack.encode('Failing Joining Code')

type InstallAgentsArgs = {
	scenario: Scenario
	number_of_agents: number
	memProof?: Uint8Array
}

type PlayerHappBundleOptions = AppOptions & {
	signalHandler?: AppSignal
}

export const installAgents = async ({
	scenario,
	number_of_agents,
	memProof,
}: InstallAgentsArgs) => {
	const happBundleOptions: PlayerHappBundleOptions = {}

	let playersHappBundles = []

	for (let i = 0; i < number_of_agents; i++) {
		playersHappBundles.push({
			appBundleSource: { type: "path", value: testHappPath },
			options: {
				...happBundleOptions,
				rolesSettings: {
					test: {
						type: "provisioned",
						value: {
							membrane_proof: memProof ? memProof : SUCCESSFUL_JOINING_CODE,
						},
					},
					test2: {
						type: "provisioned",
						value: {
							membrane_proof: memProof ? memProof : SUCCESSFUL_JOINING_CODE,
						},
					},
				},
			},
		})
	}

	let agents: Player[] = []

	try {
		agents = await scenario.addPlayersWithApps(playersHappBundles)
	} catch (e) {
		console.error('Error installing agents', inspect(e))
		throw e
	}

	return agents
}

type InstallAgentsOnConductorArgs = {
	conductor: Conductor
	number_of_agents: number
	memProof?: Uint8Array
	signalHandler?: any
}

export const installAgentsOnConductor = async ({
	conductor,
	number_of_agents,
	memProof,
}: InstallAgentsOnConductorArgs) => {
	const appBundleSource: AppBundleSource = { type: "path", value: testHappPath }

	const happBundleOptions: AppOptions = {
		rolesSettings: {
			test: {
				type: "provisioned",
				value: {
					membrane_proof: memProof ? memProof : SUCCESSFUL_JOINING_CODE,
				},
			},
			test2: {
				type: "provisioned",
				value: {
					membrane_proof: memProof ? memProof : SUCCESSFUL_JOINING_CODE,
				},
			},
		},
	}

	let agentHapps = []
	await conductor.attachAppInterface()
	for (let i = 0; i < number_of_agents; i++) {
		let appInfo = await conductor.installApp(appBundleSource, happBundleOptions)
		const adminWs = conductor.adminWs()
		const port = await conductor.attachAppInterface()
		const issued1 = await adminWs.issueAppAuthenticationToken({
			installed_app_id: appInfo.installed_app_id,
		});
		const appAgentWs = await conductor.connectAppWs(issued1.token, port)
		let app = await enableAndGetAgentApp(adminWs, appAgentWs, appInfo)
		agentHapps.push(app)
	}

	return agentHapps
}
