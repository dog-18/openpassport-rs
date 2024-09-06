"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentDateFormatted = getCurrentDateFormatted;
exports.getVkey = getVkey;
exports.checkMerkleRoot = checkMerkleRoot;
exports.verifyDSCValidity = verifyDSCValidity;
const ethers_1 = require("ethers");
const utils_1 = require("../../common/src/utils/utils");
const constants_1 = require("../../common/src/constants/constants");
const csca_1 = require("../../common/src/utils/csca");
const node_forge_1 = __importDefault(require("node-forge"));
const skiPem_1 = require("./skiPem");
const vkey_1 = require("../../common/src/constants/vkey");
const handleCertificate_1 = require("../../common/src/utils/handleCertificate");
function getCurrentDateFormatted() {
    return (0, utils_1.getCurrentDateYYMMDD)().map((datePart) => BigInt(datePart).toString());
}
function getVkey(circuit, signatureAlgorithm, hashFunction) {
    const circuitName = (0, handleCertificate_1.getCircuitName)(circuit, signatureAlgorithm, hashFunction);
    switch (circuitName) {
        case 'prove_rsa_65537_sha256':
            return vkey_1.vkey_prove_rsa_65537_sha256;
        case 'prove_rsa_65537_sha1':
            return vkey_1.vkey_prove_rsa_65537_sha1;
        case 'prove_rsapss_65537_sha256':
            return vkey_1.vkey_prove_rsapss_65537_sha256;
        default:
            throw new Error('Invalid signature algorithm or hash function');
    }
}
// OpenPassport2Step
async function checkMerkleRoot(rpcUrl, merkleRoot) {
    const provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers_1.ethers.Contract(constants_1.REGISTER_CONTRACT_ADDRESS, constants_1.REGISTER_ABI, provider);
    return await contract.checkRoot(merkleRoot);
}
// OpenPassport1Step
function getCSCAPem(formattedValueAdjusted, dev_mode) {
    const skiPem = dev_mode ? { ...skiPem_1.SKI_PEM, ...skiPem_1.SKI_PEM_DEV } : skiPem_1.SKI_PEM;
    const pem = skiPem[formattedValueAdjusted];
    return pem;
}
function verifyDSCValidity(dscCertificate, dev_mode) {
    const authorityKeyIdentifierExt = dscCertificate.extensions.find((ext) => ext.name === 'authorityKeyIdentifier');
    const value = authorityKeyIdentifierExt.value;
    const byteArray = (0, csca_1.derToBytes)(value);
    const formattedValue = byteArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
    const formattedValueAdjusted = formattedValue.substring(8); // Remove the first '3016' from the formatted string
    const csca_pem = getCSCAPem(formattedValueAdjusted, dev_mode);
    if (csca_pem === null || csca_pem === undefined) {
        console.error('Error: CSCA PEM not found');
        throw new Error('CSCA PEM not found');
    }
    const csca_certificate = node_forge_1.default.pki.certificateFromPem(csca_pem);
    try {
        const caStore = node_forge_1.default.pki.createCaStore([csca_certificate]);
        const verified = node_forge_1.default.pki.verifyCertificateChain(caStore, [dscCertificate]);
        if (!verified) {
            throw new Error('DSC certificate verification failed');
        }
        const currentDate = new Date();
        if (currentDate < dscCertificate.validity.notBefore ||
            currentDate > dscCertificate.validity.notAfter) {
            throw new Error('DSC certificate is not within its validity period');
        }
        return true;
    }
    catch (error) {
        console.error('DSC certificate validation error:', error);
        return false;
    }
}
