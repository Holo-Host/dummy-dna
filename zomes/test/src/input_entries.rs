use hdk::prelude::*;

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
pub struct LoopBack {
    value: String,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
struct SiblingEmitPayload {
    sibling: CellId,
    value: String,
}

#[derive(Serialize, Deserialize, SerializedBytes, Debug)]
struct RemoteCallPrivateInput {
    to_cell: CellId,
    cap_secret: CapSecret,
}
