export type CircuitName = "prove" | "register" | "disclose";
export interface AppType {
    name: string;
    scope: string;
    userId: string;
    sessionId: string;
    circuit: CircuitName;
    arguments: ArgumentsProve | ArgumentsRegister | ArgumentsDisclose;
    getDisclosureOptions?: () => Record<string, string>;
}
export interface ArgumentsProve {
    disclosureOptions: {
        older_than?: string;
        nationality?: string;
    };
}
export interface ArgumentsRegister {
    attestation_id: string;
}
export interface ArgumentsDisclose {
    disclosureOptions: {
        older_than?: string;
        nationality?: string;
    };
    merkle_root: string;
    merkletree_size: string;
}
export declare function reconstructAppType(json: any): AppType;
