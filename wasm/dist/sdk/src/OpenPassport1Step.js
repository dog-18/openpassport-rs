"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenPassport1StepInputs = exports.OpenPassport1StepVerifier = void 0;
exports.parsePublicSignals1Step = parsePublicSignals1Step;
const snarkjs_1 = require("snarkjs");
const constants_1 = require("../../common/src/constants/constants");
const utils_1 = require("../utils/utils");
const revealBitmap_1 = require("../../common/src/utils/revealBitmap");
const OpenPassportVerifierReport_1 = require("./OpenPassportVerifierReport");
const node_forge_1 = __importDefault(require("node-forge"));
const utils_2 = require("../../common/src/utils/utils");
const handleCertificate_1 = require("../../common/src/utils/handleCertificate");
class OpenPassport1StepVerifier {
    constructor(options) {
        this.scope = options.scope;
        this.attestationId = options.attestationId || constants_1.PASSPORT_ATTESTATION_ID;
        this.requirements = options.requirements || [];
        this.rpcUrl = options.rpcUrl || constants_1.DEFAULT_RPC_URL;
        this.report = new OpenPassportVerifierReport_1.OpenPassportVerifierReport();
        this.dev_mode = options.dev_mode || false;
    }
    async verify(openPassport1StepInputs) {
        const { signatureAlgorithm, hashFunction } = (0, handleCertificate_1.getSignatureAlgorithm)(openPassport1StepInputs.dsc);
        const vkey = (0, utils_1.getVkey)(openPassport1StepInputs.circuit, signatureAlgorithm, hashFunction);
        const parsedPublicSignals = parsePublicSignals1Step(openPassport1StepInputs.dscProof.publicSignals);
        //1. Verify the scope
        if ((0, utils_2.castToScope)(parsedPublicSignals.scope) !== this.scope) {
            this.report.exposeAttribute('scope', parsedPublicSignals.scope, this.scope);
        }
        console.log('\x1b[32m%s\x1b[0m', `- scope verified`);
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
        const verified_prove = await snarkjs_1.groth16.verify(vkey, openPassport1StepInputs.dscProof.publicSignals, openPassport1StepInputs.dscProof.proof);
        if (!verified_prove) {
            this.report.exposeAttribute('proof');
        }
        console.log('\x1b[32m%s\x1b[0m', `- proof verified`);
        this.report.nullifier = (0, utils_2.bigIntToHex)(BigInt(parsedPublicSignals.nullifier));
        this.report.user_identifier = (0, utils_2.bigIntToHex)(BigInt(parsedPublicSignals.user_identifier));
        //7 Verify the dsc
        const dscCertificate = node_forge_1.default.pki.certificateFromPem(openPassport1StepInputs.dsc);
        const verified_certificate = (0, utils_1.verifyDSCValidity)(dscCertificate, this.dev_mode);
        console.log('\x1b[32m%s\x1b[0m', 'certificate verified:' + verified_certificate);
        // @ts-ignore
        const dsc_modulus = BigInt(dscCertificate.publicKey.n);
        const dsc_modulus_words = (0, utils_2.splitToWords)(dsc_modulus, BigInt(64), BigInt(32));
        const modulus_from_proof = parsedPublicSignals.pubKey;
        const areArraysEqual = (arr1, arr2) => arr1.length === arr2.length && arr1.every((value, index) => value === arr2[index]);
        const verified_modulus = areArraysEqual(dsc_modulus_words, modulus_from_proof);
        console.log('\x1b[32m%s\x1b[0m', 'modulus verified:' + verified_modulus);
        return this.report;
    }
}
exports.OpenPassport1StepVerifier = OpenPassport1StepVerifier;
class OpenPassport1StepInputs {
    constructor(options) {
        this.dscProof = options.dscProof || {
            publicSignals: [],
            proof: [],
        };
        this.dsc = options.dsc || '';
        this.circuit = options.circuit || '';
    }
}
exports.OpenPassport1StepInputs = OpenPassport1StepInputs;
function parsePublicSignals1Step(publicSignals) {
    return {
        signature_algorithm: publicSignals[0],
        revealedData_packed: [publicSignals[1], publicSignals[2], publicSignals[3]],
        nullifier: publicSignals[4],
        pubKey: publicSignals.slice(5, 37),
        scope: publicSignals[37],
        current_date: publicSignals.slice(38, 44),
        user_identifier: publicSignals[44],
    };
}
