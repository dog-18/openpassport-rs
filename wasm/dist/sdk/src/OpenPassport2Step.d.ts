import { OpenPassportVerifierReport } from './OpenPassportVerifierReport';
export declare class OpenPassport2StepVerifier {
    scope: string;
    attestationId: string;
    requirements: string[][];
    rpcUrl: string;
    report: OpenPassportVerifierReport;
    verifyMerkleRootCall: (merkleRoot: string) => Promise<boolean>;
    constructor(options: {
        scope: string;
        attestationId?: string;
        requirements?: string[][];
        rpcUrl?: string;
        verifyMerkleRootCall: (merkleRoot: string) => Promise<boolean>;
    });
    verify(proofOfPassport2StepInputs: OpenPassport2StepInputs): Promise<OpenPassportVerifierReport>;
}
export declare class OpenPassport2StepInputs {
    publicSignals: string[];
    proof: string[];
    constructor(publicSignals: string[], proof: string[]);
}
export declare function parsePublicSignals2Step(publicSignals: any): {
    nullifier: any;
    revealedData_packed: any[];
    attestation_id: any;
    merkle_root: any;
    scope: any;
    current_date: any[];
    user_identifier: any;
};
