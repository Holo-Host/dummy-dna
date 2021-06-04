import path = require('path')
import * as _ from 'lodash'
import { Codec } from '@holo-host/cryptolib';
import { localConductorConfig, installAgents } from './utils'

module.exports = async (orchestrator) => {
  orchestrator.registerScenario('basic app functions', async (s, t) => {
    // spawn the conductor process
    const [ conductor ] = await s.players([localConductorConfig])

    // test admin api endpoints: installation and activation
    let installResult
    try{
      installResult = await installAgents(conductor,  ["alice"])
      t.ok(installResult)
    } catch(e) {
      console.log("Error",  e)
      t.fail()
    }
    
    const [alice_test_happ] = installResult
    const [alice] = alice_test_happ.cells

    // test fn: returns_obj()
    let response;
    try {
      response = await alice.call('test', 'returns_obj', null);
      console.log("returns_obj response:", response);
      t.ok(response)
      t.deepEqual(response, { value: "This is the returned value" })
    } catch(e) {
      console.error("Error: ", e);
      t.fail()
    }

    // test fn: pass_obj()
    try {
      response = await alice.call('test', 'pass_obj', { value: "This is the returned value" });
      console.log("pass_obj response:", response);
      t.ok(response)
      t.deepEqual(response, { value: "This is the returned value" })
    } catch(e) {
      console.error("Error: ", e);
      t.fail()
    }

    // test fn: return_failure()
    try {
      response = await alice.call('test', 'return_failure', null);
    } catch(e) {
      console.log("return_failure response:", e);
      t.deepEqual(e, {
        type: 'error',
        data: {
          type: 'ribosome_error',
          data: 'Wasm error while working with Ribosome: Deserialize([192])'
        }
      })
      t.pass()
    }

    // test fn: create_link()
    let link_hash_1, link_hash_2, link_hash_3;
    try {
      link_hash_1 = await alice.call('test', 'create_link', null);
      console.log("create_link response:", link_hash_1);
      t.ok(link_hash_1)
      // confirm response is header hash
      let holohash = Codec.HoloHash.encode("header", link_hash_1)
      t.equal(holohash.substring(0, 5), 'uhCkk')

      link_hash_2 = await alice.call('test', 'create_link', null);
      console.log("create_link response:", link_hash_2);
      t.ok(link_hash_2)
      // confirm response is header hash
      holohash = Codec.HoloHash.encode("header", link_hash_2)
      t.equal(holohash.substring(0, 5), 'uhCkk')  

      link_hash_3 = await alice.call('test', 'create_link', null);
      console.log("create_link response:", link_hash_3);
      t.ok(link_hash_3)
      // confirm response is header hash
      holohash = Codec.HoloHash.encode("header", link_hash_3)
      t.equal(holohash.substring(0, 5), 'uhCkk')  
    } catch(e) {
      console.error("Error: ", e);
      t.fail()
    }

    // test fn: get_links()
    try {
      response = await alice.call('test', 'get_links', null);
      console.log("get_links response", response);
      t.ok(response)
      t.equal(response.length, 3)
      t.deepEqual(response[0].create_link_hash, link_hash_1)
      t.deepEqual(response[1].create_link_hash, link_hash_2)
      t.deepEqual(response[2].create_link_hash, link_hash_3)
    } catch(e) {
      console.error("Error: ", e);
      t.fail()
    }

    // test fn: delete_link()
    try {
      response = await alice.call('test', 'delete_link', link_hash_2);
      console.log("delete_link response", response);
      t.ok(response)

      response = await alice.call('test', 'get_links', null);
      console.log("get_links response", response);
      t.ok(response)
      t.equal(response.length, 2)
      t.deepEqual(response[0].create_link_hash, link_hash_1)
      t.deepEqual(response[1].create_link_hash, link_hash_3)
    } catch(e) {
      console.error("Error: ", e);
      t.fail()
    }

    // test fn: delete_all_links()
    try {
      response = await alice.call('test', 'delete_all_links', null);
      console.log("delete_all_links response", response);
      t.equal(response, null)

      response = await alice.call('test', 'get_links', null);
      console.log("get_links response", response);
      t.ok(response)
      t.equal(response.length, 0)
    } catch(e) {
      console.error("Error: ", e);
      t.fail()
    }
  })
}
