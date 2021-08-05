use hdk::prelude::*;

entry_defs![Path::entry_def()];

fn path(s: &str) -> ExternResult<EntryHash> {
    let path = Path::from(s);
    path.ensure()?;
    Ok(path.hash()?)
}

fn base() -> ExternResult<EntryHash> {
    path("a")
}

fn target() -> ExternResult<EntryHash> {
    path("b")
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
struct JoiningCode(String);

#[hdk_extern]
fn genesis_self_check(data: GenesisSelfCheckData) -> ExternResult<ValidateCallbackResult> {
    validate_joining_code(data.membrane_proof)
}

fn validate_joining_code(
    membrane_proof: Option<MembraneProof>,
) -> ExternResult<ValidateCallbackResult> {
    debug!("Running Validation...");
    match membrane_proof {
        Some(mem_proof) => {
            match JoiningCode::try_from(mem_proof.clone()) {
                Ok(m) => {
                    if m.0 == "Failing Joining Code" {
                        debug!("Invalidation successful...");
                        return Ok(ValidateCallbackResult::Invalid(
                            "Joining code invalid: passed failing string".to_string(),
                        ));
                    } else {
                        debug!("Validation successful...");
                        return Ok(ValidateCallbackResult::Valid);
                    }
                }
                Err(e) => {
                    return Ok(ValidateCallbackResult::Invalid(format!(
                        "Joining code invalid: unable to deserialize into element ({:?})",
                        e
                    )))
                }
            };
        }
        None => Ok(ValidateCallbackResult::Invalid(
            "No membrane proof found".to_string(),
        )),
    }
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct TestObj {
    value: String,
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
    Err(WasmError::Guest("returned error".to_string()))
}

#[hdk_extern]
fn create_link(_: ()) -> ExternResult<HeaderHash> {
    Ok(hdk::prelude::create_link(base()?, target()?, ())?)
}

#[hdk_extern]
fn create_link_to_agent(agent: AgentPubKey) -> ExternResult<HeaderHash> {
    Ok(hdk::prelude::create_link(agent.into(), target()?, ())?)
}

#[hdk_extern]
fn delete_link(input: HeaderHash) -> ExternResult<HeaderHash> {
    Ok(hdk::prelude::delete_link(input)?)
}

#[hdk_extern]
fn get_links_from_agent(agent: AgentPubKey) -> ExternResult<Links> {
    Ok(hdk::prelude::get_links(agent.into(), None)?)
}

#[hdk_extern]
fn get_links_from_me(_: ()) -> ExternResult<Links> {
    Ok(hdk::prelude::get_links(
        agent_info()?.agent_initial_pubkey.into(),
        None,
    )?)
}

#[hdk_extern]
fn get_links(_: ()) -> ExternResult<Links> {
    Ok(hdk::prelude::get_links(base()?, None)?)
}

#[hdk_extern]
fn delete_all_links(_: ()) -> ExternResult<()> {
    for link in hdk::prelude::get_links(base()?, None)?.into_inner() {
        hdk::prelude::delete_link(link.create_link_hash)?;
    }
    Ok(())
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct LoopBack {
    value: String,
}

#[hdk_extern]
fn signal_loopback(value: LoopBack) -> ExternResult<()> {
    emit_signal(&value)?;
    Ok(())
}

#[hdk_extern]
fn validate(data: ValidateData) -> ExternResult<ValidateCallbackResult> {
    let element = data.element.clone();
    let entry = element.into_inner().1;
    let entry = match entry {
        ElementEntry::Present(e) => e,
        _ => return Ok(ValidateCallbackResult::Valid),
    };
    if let Entry::Agent(_) = entry {
        match data.element.header().prev_header() {
            Some(header) => match get(header.clone(), GetOptions::default())? {
                Some(element_pkg) => match element_pkg.signed_header().header() {
                    Header::AgentValidationPkg(pkg) => {
                        return validate_joining_code(pkg.membrane_proof.clone())
                    }
                    _ => {
                        return Ok(ValidateCallbackResult::Invalid(
                            "No Agent Validation Pkg found".to_string(),
                        ))
                    }
                },
                None => {
                    return Ok(ValidateCallbackResult::UnresolvedDependencies(vec![
                        (header.clone()).into(),
                    ]))
                }
            },
            None => {
                return Ok(ValidateCallbackResult::Invalid(
                    "Impossible state".to_string(),
                ))
            }
        }
    }
    Ok(ValidateCallbackResult::Valid)
}
