export declare class OpenPassportVerifierReport {
    scope: boolean;
    merkle_root: boolean;
    attestation_id: boolean;
    current_date: boolean;
    issuing_state: boolean;
    name: boolean;
    passport_number: boolean;
    nationality: boolean;
    date_of_birth: boolean;
    gender: boolean;
    expiry_date: boolean;
    older_than: boolean;
    owner_of: boolean;
    proof: boolean;
    dsc: boolean;
    valid: boolean;
    user_identifier: string;
    nullifier: string;
    constructor();
    exposeAttribute(attribute: keyof OpenPassportVerifierReport, value?: any, expectedValue?: any): void;
    toString(): string;
    getUUID(): string;
    getHexUUID(): string;
    getNullifier(): string;
}
