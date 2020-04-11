import { RsaKey } from "crypto-lib/dist/sync/types";
export declare type TowardUserKeys = {
    encryptKey: RsaKey.Public;
    decryptKey: RsaKey.Private;
};
export declare namespace TowardUserKeys {
    function stringify(towardUserKeys: TowardUserKeys): string;
    function parse(towardUserKeysStr: string): TowardUserKeys;
    function store(towardUserKeys: TowardUserKeys): Promise<void>;
    /** Assert present, throw otherwise, should be always present when
     * AuthenticatedSessionDescriptionSharedData is present */
    function retrieve(): Promise<TowardUserKeys>;
}
