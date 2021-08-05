import path = require('path')
import * as _ from 'lodash'
import { localConductorConfig, installAgents, delay } from './utils'

async function run(t, fn) {
    try {
        let response = await fn();
        // console.log("returns_obj response:", response);
        t.ok(response)
        return response
      } catch(e) {
        console.error("Error: ", e);
        t.fail()
      }
}

module.exports = async (orchestrator) => {
  orchestrator.registerScenario('basic app functions', async (s, t) => {
    // spawn the conductor process
    const [ conductor ] = await s.players([localConductorConfig])

    // test admin api endpoints: installation and activation
    let installResult
    try{
      installResult = await installAgents(conductor,  ["jack", 'liza'])
      t.ok(installResult)
    } catch(e) {
      console.log("Error",  e)
      t.fail()
    }
    
    const [jack_test_happ, liza_test_happ] = installResult
    const [jack] = jack_test_happ.cells
    const [liza] = liza_test_happ.cells

    let head = await run(t, () => jack.call('test', 'create_link_to_agent', liza_test_happ.agent))
    await delay(1000)
    let r = await run(t, () => liza.call('test', 'get_links_from_me', null))
    console.log("Before Delete: liza sees one link added", r);
    t.equal(r.length, 1)
    r = await run(t, () => jack.call('test', 'get_links_from_agent', liza_test_happ.agent))
    console.log("Before Delete: jack see the link he added to liza", r);
    t.equal(r.length, 1)
    await run(t, () => liza.call('test', 'delete_link', head))
    await delay(1000)
    r = await run(t, () => liza.call('test', 'get_links_from_me', null))
    console.log("After Delete: liza should see no link", r);
    t.equal(r.length, 0)
    await delay(15000)
    r = await run(t, () => jack.call('test', 'get_links_from_agent', liza_test_happ.agent))
    console.log("After Delete: jack should see no link from liza", r);
    t.equal(r.length, 0)
    
  })
}
