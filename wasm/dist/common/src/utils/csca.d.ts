import * as forge from "node-forge";
import { IMT } from "@zk-kit/imt";
export declare function findStartIndex(modulus: string, messagePadded: Uint8Array): number;
export declare function getCSCAInputs(dscSecret: string, dscCertificate: any, cscaCertificate: any, n_dsc: number, k_dsc: number, n_csca: number, k_csca: number, max_cert_bytes: number, devmod?: boolean): {
    signature_algorithm: any;
    inputs: {
        raw_dsc_cert: string[];
        raw_dsc_cert_padded_bytes: string[];
        csca_modulus: any;
        dsc_signature: string[];
        dsc_modulus: string[];
        start_index: string[];
        secret: string[];
        merkle_root: string[];
        path: any;
        siblings: any;
    };
};
export declare function derToBytes(derValue: string): any[];
export declare function getCSCAModulusMerkleTree(): IMT;
export declare function computeLeafFromModulusFormatted(modulus_formatted: string[]): string;
export declare function computeLeafFromModulusBigInt(modulus_bigint: bigint): string;
export declare function getCSCAModulusProof(leaf: any, n: any, k: any): any[];
export declare function getTBSHash(cert: forge.pki.Certificate, hashAlgorithm: 'sha1' | 'sha256', n: number, k: number): string[];
export declare const sendCSCARequest: (inputs_csca: any) => Promise<any>;
export declare const generateDscSecret: () => string;
