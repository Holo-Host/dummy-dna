use hdk::prelude::*;

entry_defs![PathEntry::entry_def()];

fn path(s: &str) -> ExternResult<EntryHash> {
    let path = Path::from(s);
    path.ensure()?;
    Ok(path.path_entry_hash()?)
}

fn base() -> ExternResult<EntryHash> {
    path("a")
}

fn target() -> ExternResult<EntryHash> {
    path("b")
}

#[hdk_extern]
fn init(_: ()) -> ExternResult<InitCallbackResult> {
    set_cap_tokens()?;

    Ok(InitCallbackResult::Pass)
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
    create_cap_grant(CapGrantEntry {
        tag: "".into(),
        access: ().into(),
        functions,
    })?;
    Ok(())
}

#[derive(Debug, Serialize, Deserialize, SerializedBytes, Clone)]
pub struct Props {
    pub skip_proof: bool,
}

pub fn skip_proof_sb(encoded_props: &SerializedBytes) -> bool {
    let maybe_props = Props::try_from(encoded_props.to_owned());
    if let Ok(props) = maybe_props {
        debug!("Skip proof check. Props: {:?}", props);
        return props.skip_proof;
    }
    false
}

// This is useful for test cases where we don't want to provide a membrane proof
pub fn skip_proof() -> bool {
    if let Ok(info) = dna_info() {
        return skip_proof_sb(&info.properties);
    }
    return false;
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
struct JoiningCode(String);

#[hdk_extern]
fn genesis_self_check(data: GenesisSelfCheckData) -> ExternResult<ValidateCallbackResult> {
    if skip_proof_sb(&data.dna_def.properties) {
        Ok(ValidateCallbackResult::Valid)
    } else {
        validate_joining_code(data.membrane_proof)
    }
}

pub fn is_read_only_proof(mem_proof: &MembraneProof) -> bool {
    let b = mem_proof.bytes();
    b == &[0]
}

fn validate_joining_code(
    membrane_proof: Option<MembraneProof>,
) -> ExternResult<ValidateCallbackResult> {
    debug!("Running Validation...");
    match membrane_proof {
        Some(mem_proof) => {
            if is_read_only_proof(&mem_proof) {
                return Ok(ValidateCallbackResult::Valid);
            };
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
                    )));
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
    Ok(hdk::prelude::create_link(
        base()?,
        target()?,
        HdkLinkType::Any,
        (),
    )?)
}

#[hdk_extern]
fn delete_link(input: HeaderHash) -> ExternResult<HeaderHash> {
    Ok(hdk::prelude::delete_link(input)?)
}

#[hdk_extern]
fn get_links(_: ()) -> ExternResult<Vec<Link>> {
    Ok(hdk::prelude::get_links(base()?, None)?)
}

#[hdk_extern]
fn delete_all_links(_: ()) -> ExternResult<()> {
    for link in hdk::prelude::get_links(base()?, None)? {
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

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
struct SiblingEmitPayload {
    sibling: CellId,
    value: String,
}

#[hdk_extern]
fn emit_signal_from_sibling_cell(payload: SiblingEmitPayload) -> ExternResult<()> {
    let SiblingEmitPayload { sibling, value } = payload;
    let zome_name = zome_info()?.name;
    hdk::p2p::call(
        CallTargetCell::Other(sibling),
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
fn private_function(_: ()) -> ExternResult<TestObj> {
    Ok(TestObj {
        value: "this is the result of the private function".to_string(),
    })
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
struct RemoteCallPrivateInput {
    to_cell: CellId,
    cap_secret: CapSecret,
}

#[hdk_extern]
fn remote_call_private_function(input: RemoteCallPrivateInput) -> ExternResult<TestObj> {
    let zome_name = zome_info()?.name;
    let RemoteCallPrivateInput {
        to_cell,
        cap_secret,
    } = input;

    match hdk::p2p::call(
        CallTargetCell::Other(to_cell),
        zome_name,
        FunctionName::new("private_function".to_owned()),
        Some(cap_secret),
        Some(()),
    )? {
        ZomeCallResponse::Ok(response) => Ok(response.decode()?),
        ZomeCallResponse::Unauthorized(_, _, _, _) => Err(WasmError::CallError(
            "Unauthorized call to private_function".to_string(),
        )),
        ZomeCallResponse::NetworkError(_) => Err(WasmError::CallError(
            "Network error while calling private_function".to_string(),
        )),
        ZomeCallResponse::CountersigningSession(_) => Err(WasmError::CallError(
            "Unexpected CountersigningSession while calling private_function".to_string(),
        )),
    }
}

#[hdk_extern]
fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
    match op {
        Op::StoreEntry {
            entry: Entry::Agent(_),
            header:
                SignedHashed {
                    hashed:
                        HoloHashed {
                            content: header, ..
                        },
                    ..
                },
        } => {
            let header = header.prev_header();
            match must_get_valid_element(header.clone())?
                .signed_header()
                .header()
            {
                Header::AgentValidationPkg(pkg) => {
                    if skip_proof() {
                        return Ok(ValidateCallbackResult::Valid);
                    }
                    return validate_joining_code(pkg.membrane_proof.clone());
                }
                _ => {
                    return Ok(ValidateCallbackResult::Invalid(
                        "No Agent Validation Pkg found".to_string(),
                    ))
                }
            }
        }
        _ => Ok(ValidateCallbackResult::Valid),
    }
}
