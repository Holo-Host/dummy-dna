use hdk::prelude::*;
mod input_entries;
pub use input_entries::*;
use test_integrity::*;

fn base() -> ExternResult<EntryHash> {
    let base = "base".to_string();
    let _ = Path::from(&base).typed(LinkTypes::Path)?.ensure();
    Path::from(base).path_entry_hash()
}

fn target() -> ExternResult<EntryHash> {
    Ok(agent_info()?.agent_latest_pubkey.into())
}

pub fn set_cap_tokens() -> ExternResult<()> {
    let mut functions: GrantedFunctions = BTreeSet::new();
    functions.insert((zome_info()?.name, "returns_obj".into()));
    functions.insert((zome_info()?.name, "pass_obj".into()));
    functions.insert((zome_info()?.name, "return_failure".into()));
    functions.insert((zome_info()?.name, "get_links".into()));
    functions.insert((zome_info()?.name, "signal_loopback".into()));
    functions.insert((zome_info()?.name, "emit_signal_from_sibling_cell".into()));
    functions.insert((zome_info()?.name, "get_cap_grant".into()));
    functions.insert((
        zome_info()?.name,
        "create_cap_grant_for_private_function".into(),
    ));
    create_cap_grant(CapGrantEntry {
        tag: "".into(),
        access: ().into(),
        functions,
    })?;
    Ok(())
}

#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
    set_cap_tokens()?;

    Ok(InitCallbackResult::Pass)
}

#[hdk_extern]
fn dna_info(_: ()) -> ExternResult<Props> {
    let dna_info = hdk::prelude::dna_info()?;
    Ok(Props::try_from(dna_info.properties).unwrap())
}

#[hdk_extern]
fn returns_obj(_: ()) -> ExternResult<TestObj> {
    Ok(TestObj {
        value: "This is the returned value".to_string(),
    })
}

#[hdk_extern]
fn pass_obj(t: TestObj) -> ExternResult<TestObj> {
    Ok(t)
}

#[hdk_extern]
fn return_failure(_: TestObj) -> ExternResult<()> {
    Err(wasm_error!(WasmErrorInner::Guest(
        "returned error".to_string()
    )))
}

#[hdk_extern]
fn create_link(_: ()) -> ExternResult<ActionHash> {
    Ok(hdk::prelude::create_link(
        base()?,
        target()?,
        LinkTypes::GenericLink,
        GenericLink::tag(),
    )?)
}

#[hdk_extern]
fn delete_link(input: ActionHash) -> ExternResult<ActionHash> {
    Ok(hdk::prelude::delete_link(input)?)
}

#[hdk_extern]
fn get_links(_: ()) -> ExternResult<Vec<Link>> {
    Ok(hdk::prelude::get_links(base()?, .., None)?)
}

#[hdk_extern]
fn delete_all_links(_: ()) -> ExternResult<()> {
    for link in hdk::prelude::get_links(base()?, .., None)? {
        hdk::prelude::delete_link(link.create_link_hash)?;
    }
    Ok(())
}

#[hdk_extern]
fn signal_loopback(value: LoopBack) -> ExternResult<()> {
    emit_signal(&value)?;
    Ok(())
}

#[hdk_extern]
fn emit_signal_from_sibling_cell(payload: SiblingEmitPayload) -> ExternResult<()> {
    let SiblingEmitPayload { sibling, value } = payload;
    let zome_name = zome_info()?.name;
    hdk::p2p::call(
        CallTargetCell::OtherCell(sibling),
        zome_name,
        FunctionName::new("signal_loopback".to_owned()),
        None,
        LoopBack { value },
    )?;

    Ok(())
}

#[hdk_extern]
fn create_cap_grant_for_private_function(_: ()) -> ExternResult<CapSecret> {
    let cap_secret = generate_cap_secret()?;

    let mut functions: GrantedFunctions = BTreeSet::new();
    functions.insert((zome_info()?.name, "private_function".into()));

    create_cap_grant(CapGrantEntry {
        tag: "".into(),
        access: cap_secret.into(),
        functions,
    })?;

    Ok(cap_secret)
}

#[hdk_extern]
fn private_function(_: ()) -> ExternResult<String> {
    Ok("this is the result of the private function".to_string())
}

#[hdk_extern]
fn remote_call_private_function(input: RemoteCallPrivateInput) -> ExternResult<String> {
    let zome_name = zome_info()?.name;
    let RemoteCallPrivateInput {
        to_cell,
        cap_secret,
    } = input;

    match hdk::p2p::call_remote(
        to_cell.agent_pubkey().clone(),
        zome_name,
        FunctionName::new("private_function".to_owned()),
        Some(cap_secret),
        Some(()),
    )? {
        ZomeCallResponse::Ok(response) => match response.decode() {
            Ok(r) => Ok(r),
            Err(e) => Err(wasm_error!(WasmErrorInner::Guest(e.to_string()))),
        },
        ZomeCallResponse::Unauthorized(_, _, _, _) => Err(wasm_error!(WasmErrorInner::CallError(
            "Unauthorized call to private_function".to_string()
        ))),
        ZomeCallResponse::NetworkError(_) => Err(wasm_error!(WasmErrorInner::CallError(
            "Network error while calling private_function".to_string()
        ))),
        ZomeCallResponse::CountersigningSession(_) => Err(wasm_error!(WasmErrorInner::CallError(
            "Unexpected CountersigningSession while calling private_function".to_string()
        ))),
    }
}
