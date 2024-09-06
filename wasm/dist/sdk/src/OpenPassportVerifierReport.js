"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenPassportVerifierReport = void 0;
const utils_1 = require("../../common/src/utils/utils");
class OpenPassportVerifierReport {
    constructor() {
        this.scope = true;
        this.merkle_root = true;
        this.attestation_id = true;
        this.current_date = true;
        this.issuing_state = true;
        this.name = true;
        this.passport_number = true;
        this.nationality = true;
        this.date_of_birth = true;
        this.gender = true;
        this.expiry_date = true;
        this.older_than = true;
        this.owner_of = true;
        this.proof = true;
        this.dsc = true;
        this.valid = true;
    }
    exposeAttribute(attribute, value = '', expectedValue = '') {
        console.error("%c attributes don't match", 'color: red', attribute, 'value:', value, 'expectedValue:', expectedValue);
        this[attribute] = false;
        this.valid = false;
    }
    toString() {
        return JSON.stringify(this);
    }
    getUUID() {
        return (0, utils_1.hexToUUID)(this.user_identifier);
    }
    getHexUUID() {
        return this.user_identifier;
    }
    getNullifier() {
        return this.nullifier;
    }
}
exports.OpenPassportVerifierReport = OpenPassportVerifierReport;
