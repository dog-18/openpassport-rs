import forge from 'node-forge';
export declare function getCurrentDateFormatted(): string[];
export declare function getVkey(circuit: string, signatureAlgorithm: string, hashFunction: string): {
    protocol: string;
    curve: string;
    nPublic: number;
    vk_alpha_1: string[];
    vk_beta_2: string[][];
    vk_gamma_2: string[][];
    vk_delta_2: string[][];
    vk_alphabeta_12: string[][][];
    IC: string[][];
};
export declare function checkMerkleRoot(rpcUrl: string, merkleRoot: number): Promise<any>;
export declare function verifyDSCValidity(dscCertificate: forge.pki.Certificate, dev_mode: boolean): boolean;
