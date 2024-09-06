"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDscSecret = exports.sendCSCARequest = void 0;
exports.findStartIndex = findStartIndex;
exports.getCSCAInputs = getCSCAInputs;
exports.derToBytes = derToBytes;
exports.getCSCAModulusMerkleTree = getCSCAModulusMerkleTree;
exports.computeLeafFromModulusFormatted = computeLeafFromModulusFormatted;
exports.computeLeafFromModulusBigInt = computeLeafFromModulusBigInt;
exports.getCSCAModulusProof = getCSCAModulusProof;
exports.getTBSHash = getTBSHash;
const shaPad_1 = require("./shaPad");
const forge = __importStar(require("node-forge"));
const utils_1 = require("./utils");
const constants_1 = require("../constants/constants");
const poseidon_lite_1 = require("poseidon-lite");
const imt_1 = require("@zk-kit/imt");
const serialized_csca_tree_json_1 = __importDefault(require("../../pubkeys/serialized_csca_tree.json"));
const axios_1 = __importDefault(require("axios"));
function findStartIndex(modulus, messagePadded) {
    const modulusNumArray = [];
    for (let i = 0; i < modulus.length; i += 2) {
        const hexPair = modulus.slice(i, i + 2);
        const number = parseInt(hexPair, 16);
        modulusNumArray.push(number);
    }
    const messagePaddedNumber = [];
    for (let i = 0; i < messagePadded.length; i += 1) {
        const number = Number(messagePadded[i]);
        messagePaddedNumber.push(number);
    }
    let startIndex = -1;
    for (let i = 0; i <= messagePaddedNumber.length; i++) {
        if (modulusNumArray[0] === messagePaddedNumber[i]) {
            for (let j = 0; j < modulusNumArray.length; j++) {
                if (modulusNumArray[j] !== messagePaddedNumber[i + j]) {
                    //console.log("NO MODULUS FOUND IN CERTIFICATE");
                    break;
                }
                else if (j === modulusNumArray.length - 1) {
                    //console.log("MODULUS FOUND IN CERTIFICATE");
                    startIndex = i;
                }
            }
            break;
        }
    }
    return startIndex;
}
function getCSCAInputs(dscSecret, dscCertificate, cscaCertificate = null, n_dsc, k_dsc, n_csca, k_csca, max_cert_bytes, devmod = false) {
    let csca_modulus_formatted;
    let csca_modulus_bigint;
    // the purpose of devmode is to get the csca modulus from the mock_csca certificate instead of using the registry which parses aki to csca modulus
    if (devmod) {
        // console.log('DEV MODE');
        //const csca_modulus_bigint = BigInt('0x' + csca_modulus);
        //console.log("certificate", cscaCertificate);
        //console.log('csca_modulus_hex', cscaCertificate.getPublicKeyHex());
        const rsaPublicKey = cscaCertificate.publicKey;
        const csca_modulus = rsaPublicKey.n.toString(16).toLowerCase();
        //console.log('csca_modulus', csca_modulus);
        csca_modulus_bigint = BigInt(`0x${csca_modulus}`);
        csca_modulus_formatted = (0, utils_1.splitToWords)(csca_modulus_bigint, BigInt(n_csca), BigInt(k_csca));
        //console.log('csca_modulus_formatted', csca_modulus_formatted);
    }
    else {
        // console.log('NOT DEV MODE');
        // Find the authorityKeyIdentifier extension
        const authorityKeyIdentifierExt = dscCertificate.extensions.find((ext) => ext.name === 'authorityKeyIdentifier');
        //console.log('authorityKeyIdentifierExt', authorityKeyIdentifierExt);
        const value = authorityKeyIdentifierExt.value;
        //console.log('value', value);
        const byteArray = derToBytes(value);
        //console.log('Authority Key Identifier (byte array):', byteArray);
        const formattedValue = byteArray.map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(':');
        //console.log('Formatted Authority Key Identifier:', formattedValue);
        const formattedValueAdjusted = formattedValue.substring(12); // Remove the first '30:16:80:14:' from the formatted string
        const csca_modulus = constants_1.CSCA_AKI_MODULUS[formattedValueAdjusted];
        const csca_modulus_cleaned = csca_modulus.replace(/:/g, '');
        csca_modulus_bigint = BigInt(`0x${csca_modulus_cleaned}`);
        csca_modulus_formatted = (0, utils_1.splitToWords)(csca_modulus_bigint, BigInt(n_csca), BigInt(k_csca));
        //console.log('CSCA modulus as bigint:', csca_modulus_bigint);
        //console.log('CSCA modulus extracted from json:', csca_modulus_formatted);
    }
    const signatureAlgorithm = dscCertificate.signatureOid;
    ;
    //console.log('signatureAlgorithm', signatureAlgorithm);
    //dsc modulus
    const dsc_modulus = dscCertificate.publicKey.n.toString(16).toLowerCase();
    //console.log('dsc_modulus', dsc_modulus);
    const dsc_modulus_bytes_array = dsc_modulus.match(/.{2}/g).map(byte => parseInt(byte, 16));
    //console.log('dsc_modulus_bytes_array', dsc_modulus_bytes_array);
    const dsc_modulus_bytes_array_formatted = dsc_modulus_bytes_array.map(byte => byte.toString());
    const dsc_modulus_number = BigInt(`0x${dsc_modulus}`);
    const dsc_modulus_formatted = (0, utils_1.splitToWords)(dsc_modulus_number, BigInt(n_dsc), BigInt(k_dsc));
    const dsc_signature = dscCertificate.signature;
    const dsc_signature_hex = Buffer.from(dsc_signature, 'binary').toString('hex');
    const dsc_signature_bigint = BigInt('0x' + dsc_signature_hex);
    const dsc_signature_formatted = (0, utils_1.splitToWords)(dsc_signature_bigint, BigInt(n_csca), BigInt(k_csca));
    //const formatted_dsc_signature = dsc_signature.map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(':');
    const tbsCertificateDer = forge.asn1.toDer(dscCertificate.tbsCertificate).getBytes();
    const tbsCertificateBytes = derToBytes(tbsCertificateDer);
    const dsc_tbsCertificateUint8Array = Uint8Array.from(tbsCertificateBytes.map(byte => parseInt(byte.toString(16), 16)));
    let dsc_message_padded;
    let dsc_messagePaddedLen;
    if (signatureAlgorithm === '1.2.840.113549.1.1.5') { // sha1
        [dsc_message_padded, dsc_messagePaddedLen] = (0, shaPad_1.sha1Pad)(dsc_tbsCertificateUint8Array, max_cert_bytes);
    }
    else if (signatureAlgorithm === '1.2.840.113549.1.1.11') { //sha256
        [dsc_message_padded, dsc_messagePaddedLen] = (0, shaPad_1.sha256Pad)(dsc_tbsCertificateUint8Array, max_cert_bytes);
    }
    else {
        console.log("Signature algorithm not recognized", signatureAlgorithm);
        [dsc_message_padded, dsc_messagePaddedLen] = (0, shaPad_1.sha256Pad)(dsc_tbsCertificateUint8Array, max_cert_bytes);
    }
    const startIndex = findStartIndex(dsc_modulus, dsc_message_padded);
    const startIndex_formatted = startIndex.toString();
    const dsc_message_padded_formatted = Array.from(dsc_message_padded).map((x) => x.toString());
    // console.log('dsc_message_padded_formatted', dsc_message_padded_formatted);
    const dsc_messagePaddedLen_formatted = BigInt(dsc_messagePaddedLen).toString();
    // console.log('dsc_messagePaddedLen_formatted', dsc_messagePaddedLen_formatted);
    // merkle tree saga
    const leaf = computeLeafFromModulusBigInt(csca_modulus_bigint);
    const [root, proof] = getCSCAModulusProof(leaf, n_csca, k_csca);
    return {
        "signature_algorithm": constants_1.signatureOidToName[signatureAlgorithm],
        "inputs": {
            "raw_dsc_cert": dsc_message_padded_formatted,
            "raw_dsc_cert_padded_bytes": [dsc_messagePaddedLen_formatted],
            "csca_modulus": csca_modulus_formatted,
            "dsc_signature": dsc_signature_formatted,
            "dsc_modulus": dsc_modulus_formatted,
            "start_index": [startIndex_formatted],
            "secret": [dscSecret],
            "merkle_root": [BigInt(root).toString()],
            "path": proof.pathIndices.map(index => index.toString()),
            "siblings": proof.siblings.flat().map(sibling => sibling.toString())
        }
    };
}
function derToBytes(derValue) {
    const bytes = [];
    for (let i = 0; i < derValue.length; i++) {
        bytes.push(derValue.charCodeAt(i));
    }
    return bytes;
}
function getCSCAModulusMerkleTree() {
    const tree = new imt_1.IMT(poseidon_lite_1.poseidon2, constants_1.CSCA_TREE_DEPTH, 0, 2);
    tree.setNodes(serialized_csca_tree_json_1.default);
    return tree;
}
function computeLeafFromModulusFormatted(modulus_formatted) {
    if (modulus_formatted.length <= 64) {
        const hashInputs = new Array(4);
        for (let i = 0; i < 4; i++) {
            hashInputs[i] = new Array(16).fill(BigInt(0));
        }
        for (let i = 0; i < 64; i++) {
            if (i < modulus_formatted.length) {
                hashInputs[i % 4][Math.floor(i / 4)] = BigInt(modulus_formatted[i]);
            }
        }
        for (let i = 0; i < 4; i++) {
            hashInputs[i] = (0, poseidon_lite_1.poseidon16)(hashInputs[i].map(input => input.toString()));
        }
        const finalHash = (0, poseidon_lite_1.poseidon4)(hashInputs.map(h => h));
        console.log(finalHash);
        return finalHash.toString();
    }
    else {
        throw new Error("Modulus length is too long");
    }
}
function computeLeafFromModulusBigInt(modulus_bigint) {
    if (modulus_bigint <= BigInt(2n ** 4096n - 1n)) {
        const modulus_formatted = (0, utils_1.splitToWords)(modulus_bigint, BigInt(64), BigInt(64));
        const hashInputs = new Array(4);
        for (let i = 0; i < 4; i++) {
            hashInputs[i] = new Array(16).fill(BigInt(0));
        }
        for (let i = 0; i < 64; i++) {
            if (i < modulus_formatted.length) {
                hashInputs[i % 4][Math.floor(i / 4)] = BigInt(modulus_formatted[i]);
            }
        }
        for (let i = 0; i < 4; i++) {
            hashInputs[i] = (0, poseidon_lite_1.poseidon16)(hashInputs[i].map(input => input.toString()));
        }
        const finalHash = (0, poseidon_lite_1.poseidon4)(hashInputs.map(h => h));
        //console.log(finalHash);
        return finalHash.toString();
    }
    else {
        throw new Error("Modulus length is too long");
    }
}
function getCSCAModulusProof(leaf, n, k) {
    let tree = new imt_1.IMT(poseidon_lite_1.poseidon2, constants_1.CSCA_TREE_DEPTH, 0, 2);
    tree.setNodes(serialized_csca_tree_json_1.default);
    //const tree = getCSCAModulusMerkleTree(n, k);
    const index = tree.indexOf(leaf);
    if (index === -1) {
        throw new Error("Your public key was not found in the registry");
    }
    const proof = tree.createProof(index);
    return [tree.root, proof];
}
function getTBSHash(cert, hashAlgorithm, n, k) {
    const tbsCertAsn1 = forge.pki.certificateToAsn1(cert).value[0];
    const tbsCertDer = forge.asn1.toDer(tbsCertAsn1).getBytes();
    const md = hashAlgorithm === 'sha256' ? forge.md.sha256.create() : forge.md.sha1.create();
    md.update(tbsCertDer);
    const tbsCertificateHash = md.digest();
    const tbsCertificateHashString = tbsCertificateHash.data;
    const tbsCertificateHashHex = Buffer.from(tbsCertificateHashString, 'binary').toString('hex');
    const tbsCertificateHashBigint = BigInt(`0x${tbsCertificateHashHex}`);
    console.log('tbsCertificateHashBigint', tbsCertificateHashBigint);
    return (0, utils_1.splitToWords)(tbsCertificateHashBigint, BigInt(n), BigInt(k));
}
const sendCSCARequest = async (inputs_csca) => {
    try {
        const response = await axios_1.default.post(constants_1.MODAL_SERVER_ADDRESS, inputs_csca, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            console.error('Axios error:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
        }
        else {
            console.error('Unexpected error:', error);
        }
        throw error;
    }
};
exports.sendCSCARequest = sendCSCARequest;
const generateDscSecret = () => {
    const secretBytes = forge.random.getBytesSync(31);
    return BigInt(`0x${forge.util.bytesToHex(secretBytes)}`).toString();
};
exports.generateDscSecret = generateDscSecret;
