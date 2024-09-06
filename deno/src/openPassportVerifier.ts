import { OpenPassport1StepInputs, OpenPassport1StepVerifier, OpenPassportVerifierReport } from '@openpassport/sdk';

let verifier: OpenPassport1StepVerifier | null = null;

export function initializeVerifier(options: {
    scope: string;
    attestationId?: string;
    requirements?: string[][];
    rpcUrl?: string;
    dev_mode?: boolean;
}): void {
    verifier = new OpenPassport1StepVerifier(options);
}

export async function verifyPassport(openPassport1StepInputs: OpenPassport1StepInputs): Promise<OpenPassportVerifierReport> {
    if (!verifier) {
        throw new Error("Verifier has not been initialized. Please call initializeVerifier first.");
    }
    return await verifier.verify(openPassport1StepInputs);
}
