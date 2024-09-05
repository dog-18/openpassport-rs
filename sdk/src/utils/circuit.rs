use crate::consts::vkey::{
    VerificationKey, VKEY_PROVE_RSAPSS_65537_SHA256, VKEY_PROVE_RSA_65537_SHA1, VKEY_PROVE_RSA_65537_SHA256
};

fn get_circuit_name(circuit_type: &str, signature_algorithm: &str, hash_function: &str) -> String {
    if signature_algorithm == "ecdsa" {
        format!("{}_{}_{}", circuit_type, signature_algorithm, hash_function)
    } else {
        format!(
            "{}_{}_65537_{}",
            circuit_type, signature_algorithm, hash_function
        )
    }
}

pub fn get_vkey(
    circuit: &str,
    signature_algorithm: &str,
    hash_function: &str,
) -> Result<&'static VerificationKey, &'static str> {
    let circuit_name = get_circuit_name(circuit, signature_algorithm, hash_function);

    match circuit_name.as_str() {
        "prove_rsa_65537_sha256" => Ok(&VKEY_PROVE_RSA_65537_SHA256),
        "prove_rsa_65537_sha1" => Ok(&VKEY_PROVE_RSA_65537_SHA1),
        "prove_rsapss_65537_sha256" => Ok(&VKEY_PROVE_RSAPSS_65537_SHA256),
        _ => Err("Invalid signature algorithm or hash function"),
    }
}
