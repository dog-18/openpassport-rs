export declare const getSignatureAlgorithm: (pemContent: string) => {
    signatureAlgorithm: string;
    hashFunction: string;
};
export declare const getCircuitName: (circuitType: string, signatureAlgorithm: string, hashFunction: string) => string;
export declare function getSignatureAlgorithmDetails(oid: string): {
    signatureAlgorithm: string;
    hashFunction: string;
};
