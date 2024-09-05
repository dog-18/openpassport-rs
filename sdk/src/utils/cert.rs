use openssl::x509::store::X509Store;
use openssl::x509::store::X509StoreBuilder;
use openssl::x509::store::X509StoreBuilder;
use openssl::x509::X509;

fn get_csca_pem(formatted_value_adjusted: &str, dev_mode: bool) -> Option<String> {
    let ski_pem = if dev_mode {
        let mut combined = SKI_PEM.clone();
        combined.extend(SKI_PEM_DEV.clone());
        combined
    } else {
        SKI_PEM.clone()
    };

    ski_pem.get(formatted_value_adjusted).cloned()
}

fn verify_dsc_validity(dsc_certificate: &X509, dev_mode: bool) -> Result<bool, String> {
    let authority_key_identifier_ext = dsc_certificate
        .extensions()
        .find(|ext| {
            ext.object().nid().as_raw() == openssl::nid::Nid::AUTHORITY_KEY_IDENTIFIER.as_raw()
        })
        .ok_or("Authority Key Identifier not found")?;

    let value = authority_key_identifier_ext.data().as_slice();
    let byte_array = der_to_bytes(value);
    let formatted_value = byte_array
        .iter()
        .map(|byte| format!("{:02x}", byte))
        .collect::<Vec<String>>()
        .join("");

    let formatted_value_adjusted = &formatted_value[8..]; // Remove the first '3016'
    let csca_pem = get_csca_pem(formatted_value_adjusted, dev_mode).ok_or("CSCA PEM not found")?;

    let csca_certificate =
        X509::from_pem(csca_pem.as_bytes()).map_err(|_| "Failed to parse CSCA certificate")?;

    // Create a certificate store and add the CSCA certificate
    let mut store_builder =
        X509StoreBuilder::new().map_err(|_| "Failed to create store builder")?;
    store_builder
        .add_cert(csca_certificate)
        .map_err(|_| "Failed to add CSCA certificate to store")?;
    let store = store_builder.build();

    // Verify the DSC certificate against the CSCA store
    let mut context = X509StoreBuilder::new().map_err(|_| "Failed to create store context")?;
    context
        .init(&store, dsc_certificate, &[], |ctx| ctx.verify_cert())
        .map_err(|_| "DSC certificate verification failed")?;

    // Check certificate validity period
    let current_time = openssl::asn1::Asn1Time::days_from_now(0).unwrap();
    if dsc_certificate.not_before() > &current_time || dsc_certificate.not_after() < &current_time {
        return Err("DSC certificate is not within its validity period".to_string());
    }

    Ok(true)
}
