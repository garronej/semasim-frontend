export declare type ApiExposedByHost = {
    kfd(password: string, saltHex: string, iterations: number, callRef: number): void;
};
export declare type ApiExposedToHost = {
    onKfdResult(callRef: number, resultHex: string): void;
};
export declare const apiExposedToHost: ApiExposedToHost;
export declare function kfd(password: string, saltHex: string, iterations: number): Promise<{
    resultHex: string;
}>;
