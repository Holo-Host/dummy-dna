use hdk::prelude::*;

#[derive(Serialize, Deserialize, Debug, SerializedBytes)]
pub struct LoopBack {
    pub value: String,
}

#[derive(Serialize, Deserialize, Debug, SerializedBytes)]
pub struct SiblingEmitPayload {
    pub sibling: CellId,
    pub value: String,
}

#[derive(Serialize, Deserialize, Debug, SerializedBytes)]
pub struct RemoteCallPrivateInput {
    pub to_cell: CellId,
    pub cap_secret: CapSecret,
}
