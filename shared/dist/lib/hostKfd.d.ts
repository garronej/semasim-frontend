import * as crypto from "./crypto";
export declare type ApiExposedByHost = {
    kfd(password: string, saltHex: string, iterations: number, callRef: number): void;
};
export declare type ApiExposedToHost = {
    onKfdComputed(callRef: number, resultHex: string): void;
};
export declare const apiExposedToHost: ApiExposedToHost;
export declare const kfd: crypto.computeLoginSecretAndTowardUserKeys.Kfd | undefined;
