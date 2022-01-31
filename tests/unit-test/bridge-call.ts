import { localConductorConfig, installAgents } from './utils'


module.exports = async (orchestrator) => {
  orchestrator.registerScenario('bridge call', async (s, t) => {
    const [conductor] = await s.players([localConductorConfig])
    const [aliceHapp] = await installAgents(conductor, ['alice'])
    const [cell1, cell2] = aliceHapp.cells
    const signals: any[] = []
    conductor.setSignalHandler(signal => signals.push(signal))
    const payload = { value: 'moosetown' }
    await cell1.call('test', 'emit_signal_from_sibling_cell', { sibling: cell2.cellId, ...payload })
    t.deepEqual(signals, [{
      type: 'Signal',
      data: {
        cellId: cell2.cellId,
        payload
      }
    }])
  })
}
