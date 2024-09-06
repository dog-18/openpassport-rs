import { OpenPassportVerifierReport } from './OpenPassportVerifierReport';
export declare class OpenPassport1StepVerifier {
    scope: string;
    attestationId: string;
    requirements: string[][];
    rpcUrl: string;
    report: OpenPassportVerifierReport;
    dev_mode: boolean;
    constructor(options: {
        scope: string;
        attestationId?: string;
        requirements?: string[][];
        rpcUrl?: string;
        dev_mode?: boolean;
    });
    verify(openPassport1StepInputs: OpenPassport1StepInputs): Promise<OpenPassportVerifierReport>;
}
export declare class OpenPassport1StepInputs {
    dscProof: {
        publicSignals: string[];
        proof: string[];
    };
    dsc: string;
    circuit: string;
    constructor(options: {
        dscProof?: {
            publicSignals: string[];
            proof: string[];
        };
        dsc?: string;
        circuit?: string;
    });
}
export declare function parsePublicSignals1Step(publicSignals: any): {
    signature_algorithm: any;
    revealedData_packed: any[];
    nullifier: any;
    pubKey: any;
    scope: any;
    current_date: any;
    user_identifier: any;
};
