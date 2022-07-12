use holochain_deterministic_integrity::prelude::*;
use membrane_manager_utils::*;

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
                        "Joining code invalid: unable to deserialize into record ({:?})",
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

#[hdk_extern]
fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
    match op {
        Op::StoreEntry {
            entry: Entry::Agent(_),
            action:
                SignedHashed {
                    hashed:
                        HoloHashed {
                            content: action, ..
                        },
                    ..
                },
        } => {
            let action = action.prev_action();
            match must_get_valid_record(action.clone())?
                .signed_action()
                .action()
            {
                Action::AgentValidationPkg(pkg) => {
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
