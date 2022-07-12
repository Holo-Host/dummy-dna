use holochain_deterministic_integrity::prelude::*;

#[hdk_link_types]
pub enum LinkTypes {
    PathLink,
}

// entry_defs![PathEntry::entry_def()];

#[hdk_entry_helper]
struct JoiningCode(String);

#[hdk_entry_helper]
pub struct TestObj {
    value: String,
}

#[hdk_entry_defs]
#[unit_enum(EntryTypesUnit)]
pub enum EntryTypes {
    #[entry_def(visibility = "public", required_validations = 2)]
    Invoice(invoice::Invoice),
    #[entry_def(visibility = "public", required_validations = 2)]
    Promise(promise::Promise),
    #[entry_def(visibility = "public", required_validations = 2)]
    CounterSignedTx(transaction::CounterSignedTx),
}
