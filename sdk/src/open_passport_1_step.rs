use std::str::FromStr;
use openssl::x509::X509;
use ark_bn254::Bn254;
use ark_ec::pairing::Pairing;
use ark_groth16::{verifier, Groth16, Proof};
use num_bigint::BigInt;
use x509_parser::{prelude::X509Certificate, signature_algorithm};

use crate::{
    consts::{DEFAULT_RPC_URL, PASSPORT_ATTESTATION_ID},
    open_passport_verifier_report::OpenPassportVerifierReport,
    utils::{
        big_int::big_int_to_hex, cast_to_scope, circuit::get_vkey,
        date::get_current_date_formatted, get_signature_algorithm,
    },
};

pub struct DscProof<E: Pairing> {
    pub public_signals: Vec<E::ScalarField>,
    pub proof: Proof<E>,
}

pub struct OpenPassport1StepInputs {
    pub dsc_proof: DscProof<Bn254>,
    pub dsc: String,
    pub circuit: String,
}

impl OpenPassport1StepInputs {
    pub fn new(
        dsc_proof: Option<DscProof<Bn254>>,
        dsc: Option<String>,
        circuit: Option<String>,
    ) -> Self {
        OpenPassport1StepInputs {
            dsc_proof: dsc_proof.unwrap_or_else(|| DscProof {
                public_signals: Vec::new(),
                proof: Proof::default(),
            }),
            dsc: dsc.unwrap_or_default(),
            circuit: circuit.unwrap_or_default(),
        }
    }
}

struct PublicSignals1Step {
    signature_algorithm: String,
    revealed_data_packed: [String; 3],
    nullifier: String,
    pub_key: Vec<String>,
    scope: String,
    current_date: Vec<String>,
    user_identifier: String,
}

fn parse_public_signals_1_step<E: Pairing>(
    public_signals: Vec<E::ScalarField>,
) -> PublicSignals1Step {
    PublicSignals1Step {
        signature_algorithm: public_signals[0].to_string(),
        revealed_data_packed: [
            public_signals[1].to_string(),
            public_signals[2].to_string(),
            public_signals[3].to_string(),
        ],
        nullifier: public_signals[4].to_string(),
        pub_key: public_signals[5..37]
            .iter()
            .map(|field| field.to_string())
            .collect(),
        scope: public_signals[37].to_string(),
        current_date: public_signals[38..44]
            .iter()
            .map(|field| field.to_string())
            .collect(),
        user_identifier: public_signals[44].to_string(),
    }
}

pub struct OpenPassport1StepVerifier {
    scope: String,
    attestation_id: Option<String>,
    requirements: Option<Vec<Vec<String>>>,
    rpc_url: Option<String>,
    dev_mode: Option<bool>,
    report: OpenPassportVerifierReport,
}

impl OpenPassport1StepVerifier {
    pub fn new(
        scope: String,
        attestation_id: Option<String>,
        requirements: Option<Vec<Vec<String>>>,
        rpc_url: Option<String>,
        dev_mode: Option<bool>,
    ) -> Self {
        OpenPassport1StepVerifier {
            scope,
            attestation_id: Some(
                attestation_id.unwrap_or_else(|| PASSPORT_ATTESTATION_ID.to_string()),
            ),
            requirements: Some(requirements.unwrap_or_else(Vec::new)),
            rpc_url: Some(rpc_url.unwrap_or_else(|| DEFAULT_RPC_URL.to_string())),
            report: OpenPassportVerifierReport::new(),
            dev_mode: Some(dev_mode.unwrap_or(false)),
        }
    }

    pub fn verify(
        &mut self,
        open_passport_1_step_inputs: OpenPassport1StepInputs,
    ) -> OpenPassportVerifierReport {
        let (signature_algorithm, hash_function) =
            get_signature_algorithm(&open_passport_1_step_inputs.dsc)
                .expect("Failed to get signature scheme");
        let v_key = get_vkey(
            &open_passport_1_step_inputs.circuit,
            &signature_algorithm,
            &hash_function,
        )
        .expect("Failed to get verification key");
        let parsed_public_signals =
            parse_public_signals_1_step(open_passport_1_step_inputs.dsc_proof.public_signals);

        // 1. Verify the scope
        if cast_to_scope(
            &BigInt::from_str(&parsed_public_signals.scope)
                .expect("Failed to convert scope into bigint"),
        ) != self.scope
        {
            self.report
                .expose_attribute("scope", &parsed_public_signals.scope, &self.scope);
        }
        println!("\x1b[32m{}\x1b[0m", "- scope verified");

        // 4. Verify the current_data
        if !parsed_public_signals
            .current_date
            .eq(&get_current_date_formatted())
        {
            self.report.expose_attribute(
                "current_date",
                &parsed_public_signals.current_date,
                get_current_date_formatted(),
            );
        }
        println!("\x1b[32m{}\x1b[0m", "- current_date verified");

        //TODO: 5. Verify requirement

        //6. Verify the proof
        let pvk = verifier::prepare_verifying_key::<Bn254>(vk);
        let is_verified = Groth16::verify_proof(
            &pvk,
            &open_passport_1_step_inputs.dsc_proof.proof,
            &open_passport_1_step_inputs.dsc_proof.public_signals,
        )
        .expect("Failed to verify the proof");

        if !is_verified {
            self.report.expose_attribute("proof", None, None);
        }

        self.report.nullifier = big_int_to_hex(
            &BigInt::from_str(&parsed_public_signals.nullifier)
                .expect("Failed to convert nullifier into bigint"),
        );
        self.report.user_identifier =
            big_int_to_hex(&BigInt::from_str(&parsed_public_signals.user_identifier));

        //7. Verify the dsc
        let dsc_certificate = X509::from_pem(open_passport_1_step_inputs.dsc.as_bytes()).expect("Failed to get certificate from dsc");
        let verified_certificate = 

        self.report
    }
}

// #[cfg(test)]
// mod test {
//     use std::fs::File;

//     use ark_bn254::Bn254;
//     use ark_circom::{CircomBuilder, CircomConfig};
//     use ark_groth16::{verifier, Groth16}

//     #[test]
//     fn open_passport_1_step_rsa_sha256() {
//         let cfg = CircomConfig::<Bn254>::new(
//             "../circuits/prove_rsapss_65537_sha256.wasm", "../circuits/prove_rsapass_65537_sha256.r1cs");
//         let mock_passport_data =
//         let mut builder = CircomBuilder::new(cfg);
//         builder.push_input(name, val)
//         let is_verified = Groth16::verify_proof(pvk, proof, public_inputs)
//     }
// }
