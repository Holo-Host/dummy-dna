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
    set_read_only_cap_tokens()?;

    Ok(InitCallbackResult::Pass)
}

pub fn set_read_only_cap_tokens() -> ExternResult<()> {
    let mut functions: GrantedFunctions = BTreeSet::new();
    functions.insert((zome_info()?.name, "returns_obj".into()));
    functions.insert((zome_info()?.name, "pass_obj".into()));
    functions.insert((zome_info()?.name, "return_failure".into()));
    functions.insert((zome_info()?.name, "create_link".into()));
    functions.insert((zome_info()?.name, "delete_link".into()));
    functions.insert((zome_info()?.name, "get_link".into()));
    functions.insert((zome_info()?.name, "delete_all_link".into()));
    functions.insert((zome_info()?.name, "signal_loopback".into()));
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
            Some(header) => {
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
            None => {
                return Ok(ValidateCallbackResult::Invalid(
                    ""Impossible state (entry being validated will always have a previous header)"".to_string(),
                ))
            }
        }
    }
    Ok(ValidateCallbackResult::Valid)
}
