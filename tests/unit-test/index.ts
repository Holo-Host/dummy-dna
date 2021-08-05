import { Orchestrator } from '@holochain/tryorama'

let orchestrator = new Orchestrator()
// require('./endpoints')(orchestrator)
// orchestrator.run()

// orchestrator = new Orchestrator()
// require('./validation')(orchestrator)
// orchestrator.run()

orchestrator = new Orchestrator()
require('./delete')(orchestrator)
orchestrator.run()