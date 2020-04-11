/** Soult be used only with react-native */
export declare type Credentials = Omit<import("../../web_api_declaration").loginUser.Params, "uaInstanceId"> & {
    uaInstanceId: string;
};
export declare namespace Credentials {
    function isPresent(): Promise<boolean>;
    function remove(): Promise<void>;
    /** assert isPresent */
    function get(): Promise<Credentials>;
    function set(authenticatedSessionDescriptorSharedData: Credentials): Promise<void>;
}
