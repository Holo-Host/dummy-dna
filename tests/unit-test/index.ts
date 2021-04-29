import { Orchestrator } from '@holochain/tryorama'

let orchestrator = new Orchestrator()
require('./basic')(orchestrator)
orchestrator.run()