export declare type JustRegistered = {
    password: string;
    secret: string;
    towardUserKeys: import("./TowardUserKeys").TowardUserKeys;
    promptEmailValidationCode: boolean;
};
export declare namespace JustRegistered {
    function store(justRegistered: JustRegistered): Promise<void>;
    /** Will remove from internal storage */
    function retrieve(): Promise<JustRegistered | undefined>;
}
