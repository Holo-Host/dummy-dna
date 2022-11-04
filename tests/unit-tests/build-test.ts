import test from 'tape-promise/tape.js'
import { runScenario, Scenario } from '@holochain/tryorama'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test('test properties set in happ build', async (t) => {
	await runScenario(async (scenario: Scenario) => {
		try {
			const alicePlayer = await scenario.addPlayerWithHappBundle({
				path: path.join(__dirname, '../../test-skip-proof.happ'),
			})

			const [cell1, cell2] = alicePlayer.cells

			let dna_info: any = await cell1.callZome({
				zome_name: 'test',
				fn_name: 'dna_info',
			})

			console.log('DNA INFO : ', dna_info)

			t.deepEqual(dna_info.skip_proof, true)
			t.deepEqual(dna_info.dna_index, 88)
		} catch (e) {
			console.error('test error: ', e)
			t.fail()
		}
	})
})
