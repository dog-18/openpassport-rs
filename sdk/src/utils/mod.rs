pub mod circuit;
pub mod date;
pub mod big_int;
pub mod cert;

use std::collections::HashMap;

use anyhow::{Ok, Result};
use ark_std::rand::{self, Rng};
use base64::{engine::general_purpose, Engine};
use num_bigint::BigInt;
use sha1::{Digest, Sha1};
use sha2::{Sha256, Sha384};
use x509_parser::{parse_x509_certificate, signature_algorithm};

use crate::{
    consts::{
        country_code::CountryCode, SignatureType, mock::{MOCK_DSC_KEY_SHA1_RSA_4096, MOCK_DSC_KEY_SHA256_RSAPSS_4096,
        MOCK_DSC_SHA1_RSA_4096, MOCK_DSC_SHA256_RSAPSS_4096, MOCK_DSC_SHA256_RSA_4096},
    },
    PassportData,
};
use crate::consts::mock::MOCK_DSC_KEY_SHA256_RSA_4096;

pub fn cast_to_scope(num: &BigInt) -> String {
    let str_num = num.to_string();
    let str_trimmed = &str_num[1..]; // Remove leading '1'
    
    str_trimmed
        .as_bytes()
        .chunks(3)
        .map(|chunk| {
            let chunk_str = std::str::from_utf8(chunk).unwrap();
            u32::from_str_radix(chunk_str, 10).unwrap() as u8 as char
        })
        .collect()
}

// TODO: check error handling
pub fn get_signature_algorithm(pem_content: &str) -> Result<(String, String)> {
    let pem_content = pem_content.replace("-----BEGIN CERTIFICATE-----", "")
        .replace("-----END CERTIFICATE-----", "")
        .replace("\n", "");
        
    let cert_der = general_purpose::STANDARD.decode(&pem_content).map_err(|_| "Failed to decode base64").expect("Failed to decode");

    // Parse DER encoded certificate
    let (_, parced_cert) = parse_x509_certificate(&cert_der).map_err(|_| "Failed to parse certificate").expect("Failed to parse certificate");
    let signature_algorithm_old = parced_cert.signature_algorithm.algorithm;

    // Map the OID to sig algorithm and hash function
    Ok(get_signature_algorithm_details(&signature_algorithm_old.to_id_string().as_str()))
}

fn get_signature_algorithm_details(oid: &str) -> (String, String) {
    let mut details = HashMap::new();

    details.insert("1.2.840.113549.1.1.5", ("rsa".to_string(), "sha1".to_string()));
    details.insert("1.2.840.113549.1.1.11", ("rsa".to_string(), "sha256".to_string()));
    details.insert("1.2.840.113549.1.1.12", ("rsa".to_string(), "sha384".to_string()));
    details.insert("1.2.840.113549.1.1.13", ("rsa".to_string(), "sha512".to_string()));
    details.insert("1.2.840.113549.1.1.10", ("rsapss".to_string(), "sha256".to_string())); // TODO: detect which hash function is used (not always sha256)
    details.insert("1.2.840.10045.4.1", ("ecdsa".to_string(), "sha1".to_string()));
    details.insert("1.2.840.10045.4.3.1", ("ecdsa".to_string(), "sha224".to_string()));
    details.insert("1.2.840.10045.4.3.2", ("ecdsa".to_string(), "sha256".to_string()));
    details.insert("1.2.840.10045.4.3.3", ("ecdsa".to_string(), "sha384".to_string()));
    details.insert("1.2.840.10045.4.3.4", ("ecdsa".to_string(), "sha512".to_string()));

    match details.get(oid) {
        Some((signature_algorithm, hash_function)) => (signature_algorithm.clone(), hash_function.clone()),
        None => (format!("Unknown ({})", oid), "Unknown".to_string()),
    }
}

pub fn gen_mock_passport_data(
    signature_type: SignatureType,
    nationality: CountryCode,
    birth_date: String,
    expiry_date: String,
) -> Result<PassportData> {
    if birth_date.len() != 6 || expiry_date.len() != 6 {
        anyhow::bail!("Birth date and expiry date have to be in the \"YYMMDD\" format");
    }

    let mrz = generate_mrz(nationality, &birth_date, &expiry_date);
    let (signature_algorithm, hash_len, sample_data_hashes, private_key_pem, dsc) =
        configure_signature(signature_type);
    let mrz_hash = hash(&signature_algorithm, &format_mrz(&mrz))?;
    let data_hashes = vec![(1, mrz_hash)];

    let x = sample_data_hashes;
    data_hashes.extend(sample_data_hashes.into());
    let concatenated_data_hashes= format_and_concatenate_data_hashes(
        data_hashes,
        30
    )

}

fn format_mrz(mrz: &str) -> Vec<u8> {
    let mut mrz_charcodes: Vec<u8> = mrz.chars().map(|c| c as u8).collect();

    mrz_charcodes.insert(0, 88); // the length of the mrz data
    mrz_charcodes.insert(0, 95); // part of MRZ_INFO_TAG
    mrz_charcodes.insert(0, 31); // part of MRZ_INFO_TAG
    mrz_charcodes.insert(0, 91); // the new length of the whole array
    mrz_charcodes.insert(0, 97); // the tag for DG1

    mrz_charcodes
}

fn format_and_concatenate_data_hashes(
    data_hashes: &[(u8, Vec<u8>)],
    dg1_hash_offset: usize,
) -> Vec<u8> {
    let mut concat: Vec<u8> = Vec::new();

    // Generate starting sequence with random values
    let mut rng = rand::thread_rng();
    let starting_sequence: Vec<i8> = (0..dg1_hash_offset)
        .map(|_| rng.gen_range(-128..128))
        .collect();

    concat.extend(starting_sequence);

    for data_hash in data_hashes {
        concat.extend(&data_hash.1);
    }

    concat
}

fn generate_mrz(nationality: CountryCode, birth_date: &str, expiry_date: &str) -> String {
    format!(
        "P<{}DUPONT<<ALPHONSE<HUGUES<ALBERT<<<<<<<<<24HB818324{}{}1M{}5<<<<<<<<<<<<<<02",
        nationality.as_str(),
        nationality.as_str(),
        birth_date,
        expiry_date
    )
}

fn configure_signature(
    signature_type: SignatureType,
) -> (String, usize, Vec<(u32, Vec<i32>)>, String, String) {
    let (signature_algorithm, hash_len, sample_data_hashes, private_key_pem, dsc) =
        match signature_type {
            SignatureType::RsaSha1 => (
                "sha1WithRSAEncryption".to_string(),
                20,
                sample_data_hashes_small(),
                MOCK_DSC_KEY_SHA1_RSA_4096,
                MOCK_DSC_SHA1_RSA_4096,
            ),
            SignatureType::RsaSha256 => (
                "sha256WithRSAEncryption".to_string(),
                32,
                sample_data_hashes_large().into_iter().map(|(id, hash)| (id, hash.into_iter().map(|x| x as u8).collect()))
                .collect(),
                MOCK_DSC_KEY_SHA256_RSA_4096,
                MOCK_DSC_SHA256_RSA_4096,
            ),
            SignatureType::RsaPssSha256 => (
                "sha256WithRSASSAPSS".to_string(),
                32,
                sample_data_hashes_large().into_iter().map(|(id, hash)| (id, hash.into_iter().map(|x| x as u8).collect()))
                .collect(),
                MOCK_DSC_KEY_SHA256_RSAPSS_4096,
                MOCK_DSC_SHA256_RSAPSS_4096,
            ),
        };

    (
        signature_algorithm,
        hash_len,
        sample_data_hashes,
        private_key_pem.to_owned(),
        dsc.to_owned(),
    )
}

fn hash(signature_algorithm: &str, bytes_array: &[u8]) -> Result<Vec<u8>> {
    // Convert signed i8 to unsigned u8
    let unsigned_bytes_array: Vec<u8> = bytes_array.iter().map(|&byte| byte as u8).collect();
    
    // Hash the result according to the specified algorithm
    let hash_result = match signature_algorithm {
        "sha1WithRSAEncryption" | "ecdsa-with-SHA1" => {
            let mut hasher = Sha1::new();
            hasher.update(&unsigned_bytes_array);
            hasher.finalize().to_vec()
        },
        "SHA384withECDSA" => {
            let mut hasher = Sha384::new();
            hasher.update(&unsigned_bytes_array);
            hasher.finalize().to_vec()
        },
        "sha256WithRSAEncryption" | "sha256WithRSASSAPSS" => {
            let mut hasher = Sha256::new();
            hasher.update(&unsigned_bytes_array);
            hasher.finalize().to_vec()
        },
        _ => {
            // Default to sha256
            let mut hasher = Sha256::new();
            hasher.update(&unsigned_bytes_array);
            hasher.finalize().to_vec()
        }
    };
    
    Ok(hash_result)
}

pub fn sample_data_hashes_small() -> Vec<(u32, Vec<i32>)> {
    vec![
        (
            2,
            vec![
                -66, 82, -76, -21, -34, 33, 79, 50, -104, -120, -114, 35, 116, -32, 6, -14, -100,
                -115, -128, -8,
            ],
        ),
        (
            3,
            vec![
                0, -62, 104, 108, -19, -10, 97, -26, 116, -58, 69, 110, 26, 87, 17, 89, 110, -57,
                108, -6,
            ],
        ),
        (
            14,
            vec![
                76, 123, -40, 13, 51, -29, 72, -11, 59, -63, -18, -90, 103, 49, 23, -92, -85, -68,
                -62, -59,
            ],
        ),
    ]
}

pub fn sample_data_hashes_large() -> Vec<(u32, Vec<i32>)> {
    vec![
        (
            2,
            vec![
                -66, 82, -76, -21, -34, 33, 79, 50, -104, -120, -114, 35, 116, -32, 6, -14, -100,
                -115, -128, -8, 10, 61, 98, 86, -8, 45, -49, -46, 90, -24, -81, 38,
            ],
        ),
        (
            3,
            vec![
                0, -62, 104, 108, -19, -10, 97, -26, 116, -58, 69, 110, 26, 87, 17, 89, 110, -57,
                108, -6, 36, 21, 39, 87, 110, 102, -6, -43, -82, -125, -85, -82,
            ],
        ),
        (
            11,
            vec![
                -120, -101, 87, -112, 111, 15, -104, 127, 85, 25, -102, 81, 20, 58, 51, 75, -63,
                116, -22, 0, 60, 30, 29, 30, -73, -115, 72, -9, -1, -53, 100, 124,
            ],
        ),
        (
            12,
            vec![
                41, -22, 106, 78, 31, 11, 114, -119, -19, 17, 92, 71, -122, 47, 62, 78, -67, -23,
                -55, -42, 53, 4, 47, -67, -55, -123, 6, 121, 34, -125, 64, -114,
            ],
        ),
        (
            13,
            vec![
                91, -34, -46, -63, 62, -34, 104, 82, 36, 41, -118, -3, 70, 15, -108, -48, -100, 45,
                105, -85, -15, -61, -71, 43, -39, -94, -110, -55, -34, 89, -18, 38,
            ],
        ),
        (
            14,
            vec![
                76, 123, -40, 13, 51, -29, 72, -11, 59, -63, -18, -90, 103, 49, 23, -92, -85, -68,
                -62, -59, -100, -69, -7, 28, -58, 95, 69, 15, -74, 56, 54, 38,
            ],
        ),
    ]
}
