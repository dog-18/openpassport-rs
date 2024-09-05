#[derive(Debug)]
pub struct OpenPassportVerifierReport {
    scope: bool,
    merkle_root: bool,
    attestation_id: bool,
    current_date: bool,
    issuing_state: bool,
    name: bool,
    passport_number: bool,
    nationality: bool,
    date_of_birth: bool,
    gender: bool,
    expiry_date: bool,
    older_than: bool,
    owner_of: bool,
    proof: bool,
    dsc: bool,
    valid: bool,
    pub user_identifier: String,
    pub nullifier: String,
}

impl OpenPassportVerifierReport {
    pub fn new() -> Self {
        OpenPassportVerifierReport {
            scope: true,
            merkle_root: true,
            attestation_id: true,
            current_date: true,
            issuing_state: true,
            name: true,
            passport_number: true,
            nationality: true,
            date_of_birth: true,
            gender: true,
            expiry_date: true,
            older_than: true,
            owner_of: true,
            proof: true,
            dsc: true,
            valid: true,
            user_identifier: String::new(),
            nullifier: String::new(),
        }
    }

    pub fn expose_attribute(
        &mut self,
        attribute: &str,
        value: Option<&str>,
        expected_value: Option<&str>,
    ) {
        // TODO: fix
        // println!(
        //     "\x1b[31mAttributes don't match\x1b[0m: {} value: {} expectedValue: {}",
        //     attribute, value, expected_value
        // );

        if let Some(field) = self.get_mut_bool_field(attribute) {
            *field = false;
        }

        self.valid = false;
    }

    fn get_mut_bool_field(&mut self, field_name: &str) -> Option<&mut bool> {
        match field_name {
            "scope" => Some(&mut self.scope),
            "merkle_root" => Some(&mut self.merkle_root),
            "attestation_id" => Some(&mut self.attestation_id),
            "current_date" => Some(&mut self.current_date),
            "issuing_state" => Some(&mut self.issuing_state),
            "name" => Some(&mut self.name),
            "passport_number" => Some(&mut self.passport_number),
            "nationality" => Some(&mut self.nationality),
            "date_of_birth" => Some(&mut self.date_of_birth),
            "gender" => Some(&mut self.gender),
            "expiry_date" => Some(&mut self.expiry_date),
            "older_than" => Some(&mut self.older_than),
            "owner_of" => Some(&mut self.owner_of),
            "proof" => Some(&mut self.proof),
            "dsc" => Some(&mut self.dsc),
            _ => None,
        }
    }

    // pub fn to_string(&self) -> String {
    //     serde_json::to_string(self).unwrap_or_else(|_| "Failed to serialize".to_string())
    // }

    pub fn get_uuid(&self) -> Option<String> {
        Some(hex_to_uuid(&self.user_identifier))
    }

    pub fn get_hex_uuid(&self) -> &str {
        &self.user_identifier
    }

    pub fn get_nullifier(&self) -> &str {
        &self.nullifier
    }
}

fn hex_to_uuid(hex: &str) -> String {
    format!(
        "{}-{}-{}-{}-{}",
        &hex[0..8],
        &hex[8..12],
        &hex[12..16],
        &hex[16..20],
        &hex[20..]
    )
}
