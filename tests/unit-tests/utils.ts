import { Conductor, AppOptions, Player, Scenario } from '@holochain/tryorama';
import { AppBundleSource, AppSignalCb } from '@holochain/client';
import * as msgpack from '@msgpack/msgpack';
import path from 'path';
import { fileURLToPath } from 'url';
import { inspect } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const testHappPath = path.join(__dirname, '../../test.happ');

const SUCCESSFUL_JOINING_CODE = msgpack.encode('joining code');
export const INVALID_JOINING_CODE = msgpack.encode('Failing Joining Code');

type InstallAgentsArgs = {
	scenario: Scenario;
	number_of_agents: number;
	memProof?: Uint8Array;
};

type PlayerHappBundleOptions = AppOptions & {
	signalHandler?: AppSignalCb;
};

export const installAgents = async ({
	scenario,
	number_of_agents,
	memProof,
}: InstallAgentsArgs) => {
	const happBundleOptions: PlayerHappBundleOptions = {
		membraneProofs: {
			test: Buffer.from(memProof ? memProof : SUCCESSFUL_JOINING_CODE),
			test2: Buffer.from(memProof ? memProof : SUCCESSFUL_JOINING_CODE),
		},
	};

	let playersHappBundles = [];

	for (let i = 0; i < number_of_agents; i++) {
		playersHappBundles.push({
			appBundleSource: { path: testHappPath } as AppBundleSource,
			options: happBundleOptions,
		});
	}

	let agents: Player[] = [];

	try {
		agents = await scenario.addPlayersWithApps(playersHappBundles);
	} catch (e) {
		console.error('Error installing agents', inspect(e));
		throw e;
	}

	return agents;
};

type InstallAgentsOnConductorArgs = {
	conductor: Conductor;
	number_of_agents: number;
	memProof?: Uint8Array;
	signalHandler?: any;
};

export const installAgentsOnConductor = async ({
	conductor,
	number_of_agents,
	memProof,
}: InstallAgentsOnConductorArgs) => {
	const appBundleSource: AppBundleSource = { path: testHappPath };

	const happBundleOptions: AppOptions = {
		membraneProofs: {
			test: Buffer.from(memProof ? memProof : SUCCESSFUL_JOINING_CODE),
			test2: Buffer.from(memProof ? memProof : SUCCESSFUL_JOINING_CODE),
		},
	};

	let agentHapps = [];

	for (let i = 0; i < number_of_agents; i++) {
		agentHapps.push(
			await conductor.installApp(appBundleSource, happBundleOptions)
		);
	}

	return agentHapps;
};
