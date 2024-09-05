pub mod consts;
mod open_passport_1_step;
mod utils;
pub mod open_passport_verifier_report;

#[derive(Debug, Clone)]
pub struct PublicKey {
    pub modulus: Option<String>,
    pub exponent: Option<String>,
    pub curve_name: Option<String>,
    pub public_key_q: Option<String>,
}

#[derive(Debug, Clone)]
pub struct PassportData {
    pub mrz: String,
    pub signature_algorithm: String,
    pub dsc: Option<String>,
    pub pub_key: Option<PublicKey>,
    pub data_group_hashes: Vec<u8>,
    pub e_content: Vec<u8>,
    pub encrypted_digest: Vec<u8>,
    pub photo_base64: String,
    pub mock_user: Option<bool>,
}

#[derive(Debug, Clone)]
pub struct ProofElements {
    pub a: [String; 2],
    pub b: [[String; 2]; 2],
    pub c: [String; 2],
}

#[derive(Debug, Clone)]
pub struct Proof {
    pub proof: ProofElements,
    pub pub_signals: Vec<String>,
}

pub fn cast_csca_proof(proof: serde_json::Value) -> Proof {
    Proof {
        proof: ProofElements {
            a: [
                proof["proof"]["pi_a"][0].as_str().unwrap().to_string(),
                proof["proof"]["pi_a"][1].as_str().unwrap().to_string(),
            ],
            b: [
                [
                    proof["proof"]["pi_b"][0][0].as_str().unwrap().to_string(),
                    proof["proof"]["pi_b"][0][1].as_str().unwrap().to_string(),
                ],
                [
                    proof["proof"]["pi_b"][1][0].as_str().unwrap().to_string(),
                    proof["proof"]["pi_b"][1][1].as_str().unwrap().to_string(),
                ],
            ],
            c: [
                proof["proof"]["pi_c"][0].as_str().unwrap().to_string(),
                proof["proof"]["pi_c"][1].as_str().unwrap().to_string(),
            ],
        },
        pub_signals: proof["pub_signals"]
            .as_array()
            .unwrap()
            .iter()
            .map(|s| s.as_str().unwrap().to_string())
            .collect(),
    }
}
