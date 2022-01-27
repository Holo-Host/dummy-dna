import { Orchestrator } from '@holochain/tryorama'

let orchestrator

orchestrator = new Orchestrator()
require('./endpoints')(orchestrator)
orchestrator.run()

orchestrator = new Orchestrator()
require('./validation')(orchestrator)
orchestrator.run()

orchestrator = new Orchestrator()
require('./bridge-call')(orchestrator)
orchestrator.run()
