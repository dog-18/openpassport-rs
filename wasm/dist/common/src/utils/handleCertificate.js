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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCircuitName = exports.getSignatureAlgorithm = void 0;
exports.getSignatureAlgorithmDetails = getSignatureAlgorithmDetails;
const asn1 = __importStar(require("asn1js"));
const pkijs_1 = require("pkijs");
const getSignatureAlgorithm = (pemContent) => {
    const certBuffer = Buffer.from(pemContent.replace(/(-----(BEGIN|END) CERTIFICATE-----|\n)/g, ''), 'base64');
    const asn1Data = asn1.fromBER(certBuffer);
    const cert = new pkijs_1.Certificate({ schema: asn1Data.result });
    const signatureAlgorithmOid = cert.signatureAlgorithm.algorithmId;
    const { signatureAlgorithm, hashFunction } = getSignatureAlgorithmDetails(signatureAlgorithmOid);
    return { signatureAlgorithm, hashFunction };
};
exports.getSignatureAlgorithm = getSignatureAlgorithm;
const getCircuitName = (circuitType, signatureAlgorithm, hashFunction) => {
    if (signatureAlgorithm === 'ecdsa') {
        return circuitType + "_" + signatureAlgorithm + "_" + hashFunction;
    }
    else {
        return circuitType + "_" + signatureAlgorithm + "_65537_" + hashFunction;
    }
};
exports.getCircuitName = getCircuitName;
function getSignatureAlgorithmDetails(oid) {
    const details = {
        '1.2.840.113549.1.1.5': { signatureAlgorithm: 'rsa', hashFunction: 'sha1' },
        '1.2.840.113549.1.1.11': { signatureAlgorithm: 'rsa', hashFunction: 'sha256' },
        '1.2.840.113549.1.1.12': { signatureAlgorithm: 'rsa', hashFunction: 'sha384' },
        '1.2.840.113549.1.1.13': { signatureAlgorithm: 'rsa', hashFunction: 'sha512' },
        // rsapss
        '1.2.840.113549.1.1.10': { signatureAlgorithm: 'rsapss', hashFunction: 'sha256' }, // TODO: detect which hash function is used (not always sha256)
        // ecdsa
        '1.2.840.10045.4.1': { signatureAlgorithm: 'ecdsa', hashFunction: 'sha1' },
        '1.2.840.10045.4.3.1': { signatureAlgorithm: 'ecdsa', hashFunction: 'sha224' },
        '1.2.840.10045.4.3.2': { signatureAlgorithm: 'ecdsa', hashFunction: 'sha256' },
        '1.2.840.10045.4.3.3': { signatureAlgorithm: 'ecdsa', hashFunction: 'sha384' },
        '1.2.840.10045.4.3.4': { signatureAlgorithm: 'ecdsa', hashFunction: 'sha512' },
    };
    return details[oid] || { signatureAlgorithm: `Unknown (${oid})`, hashFunction: 'Unknown' };
}
