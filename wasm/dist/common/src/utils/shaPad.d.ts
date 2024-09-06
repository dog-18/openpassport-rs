export declare function shaPad(signatureAlgorithm: string, prehash_prepad_m: Uint8Array, maxShaBytes: number): [Uint8Array, number];
export declare function sha1Pad(prehash_prepad_m: Uint8Array, maxShaBytes: number): [Uint8Array, number];
export declare function sha256Pad(prehash_prepad_m: Uint8Array, maxShaBytes: number): [Uint8Array, number];
export declare function int64toBytes(num: number): Uint8Array;
export declare function mergeUInt8Arrays(a1: Uint8Array, a2: Uint8Array): Uint8Array;
export declare function int8toBytes(num: number): Uint8Array;
export declare function assert(cond: boolean, errorMessage: string): void;
