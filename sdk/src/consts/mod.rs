pub mod vkey;
pub mod country_code;
pub mod mock;
pub mod certs;

#[derive(Debug)]
pub enum SignatureType {
    RsaSha1,
    RsaSha256,
    RsaPssSha256,
}

pub const DEFAULT_RPC_URL: &str = "https://mainnet.optimism.io";

pub const PASSPORT_ATTESTATION_ID: &str = "8518753152044246090169372947057357973469996808638122125210848696986717482788";

