"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenPassport2StepInputs = exports.OpenPassport2StepVerifier = void 0;
exports.parsePublicSignals2Step = parsePublicSignals2Step;
const snarkjs_1 = require("snarkjs");
const constants_1 = require("../../common/src/constants/constants");
const utils_1 = require("../utils/utils");
const revealBitmap_1 = require("../../common/src/utils/revealBitmap");
const OpenPassportVerifierReport_1 = require("./OpenPassportVerifierReport");
const vkey_1 = require("../../common/src/constants/vkey");
class OpenPassport2StepVerifier {
    constructor(options) {
        this.scope = options.scope;
        this.attestationId = options.attestationId || constants_1.PASSPORT_ATTESTATION_ID;
        this.requirements = options.requirements || [];
        this.rpcUrl = options.rpcUrl || constants_1.DEFAULT_RPC_URL;
        this.report = new OpenPassportVerifierReport_1.OpenPassportVerifierReport();
    }
    async verify(proofOfPassport2StepInputs) {
        const parsedPublicSignals = parsePublicSignals2Step(proofOfPassport2StepInputs.publicSignals);
        //1. Verify the scope
        if (parsedPublicSignals.scope !== this.scope) {
            this.report.exposeAttribute('scope', parsedPublicSignals.scope, this.scope);
        }
        console.log('\x1b[32m%s\x1b[0m', `- scope verified`);
        //2. Verify the merkle_root
        const merkleRootIsValid = await this.verifyMerkleRootCall(parsedPublicSignals.merkle_root);
        if (!merkleRootIsValid) {
            this.report.exposeAttribute('merkle_root');
        }
        console.log('\x1b[32m%s\x1b[0m', `- merkle_root verified`);
        //3. Verify the attestation_id
        if (parsedPublicSignals.attestation_id !== this.attestationId) {
            this.report.exposeAttribute('attestation_id', parsedPublicSignals.attestation_id, this.attestationId);
        }
        console.log('\x1b[32m%s\x1b[0m', `- attestation_id verified`);
        //4. Verify the current_date
        if (parsedPublicSignals.current_date.toString() !== (0, utils_1.getCurrentDateFormatted)().toString()) {
            this.report.exposeAttribute('current_date', parsedPublicSignals.current_date, (0, utils_1.getCurrentDateFormatted)());
        }
        console.log('\x1b[32m%s\x1b[0m', `- current_date verified`);
        //5. Verify requirements
        const unpackedReveal = (0, revealBitmap_1.unpackReveal)(parsedPublicSignals.revealedData_packed);
        for (const requirement of this.requirements) {
            const attribute = requirement[0];
            const value = requirement[1];
            const position = constants_1.attributeToPosition[attribute];
            let attributeValue = '';
            for (let i = position[0]; i <= position[1]; i++) {
                attributeValue += unpackedReveal[i];
            }
            if (requirement[0] === 'nationality' || requirement[0] === 'issuing_state') {
                if (!constants_1.countryCodes[attributeValue] || constants_1.countryCodes[attributeValue] !== value) {
                    this.report.exposeAttribute(attribute);
                }
            }
            else {
                if (attributeValue !== value) {
                    this.report.exposeAttribute(attribute);
                }
            }
            console.log('\x1b[32m%s\x1b[0m', `- requirement ${requirement[0]} verified`);
        }
        //6. Verify the proof
        const verified_disclose = await snarkjs_1.groth16.verify(vkey_1.vkey_disclose, proofOfPassport2StepInputs.publicSignals, proofOfPassport2StepInputs.proof);
        if (!verified_disclose) {
            this.report.exposeAttribute('proof');
        }
        console.log('\x1b[32m%s\x1b[0m', `- proof verified`);
        this.report.nullifier = parsedPublicSignals.nullifier;
        this.report.user_identifier = parsedPublicSignals.user_identifier;
        return this.report;
    }
}
exports.OpenPassport2StepVerifier = OpenPassport2StepVerifier;
class OpenPassport2StepInputs {
    constructor(publicSignals, proof) {
        this.publicSignals = publicSignals;
        this.proof = proof;
    }
}
exports.OpenPassport2StepInputs = OpenPassport2StepInputs;
function parsePublicSignals2Step(publicSignals) {
    return {
        nullifier: publicSignals[0],
        revealedData_packed: [publicSignals[1], publicSignals[2], publicSignals[3]],
        attestation_id: publicSignals[4],
        merkle_root: publicSignals[5],
        scope: publicSignals[6],
        current_date: [
            publicSignals[7],
            publicSignals[8],
            publicSignals[9],
            publicSignals[10],
            publicSignals[11],
            publicSignals[12],
        ],
        user_identifier: publicSignals[13],
    };
}
