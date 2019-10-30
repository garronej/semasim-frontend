export declare type AuthenticatedSessionDescriptorSharedData = {
    connect_sid: string;
    email: string;
    uaInstanceId: string;
    encryptedSymmetricKey: string;
};
export declare namespace AuthenticatedSessionDescriptorSharedData {
    function isPresent(): Promise<boolean>;
    function remove(): Promise<void>;
    /** assert isPresent */
    function get(): Promise<AuthenticatedSessionDescriptorSharedData>;
    function set(authenticatedSessionDescriptorSharedData: AuthenticatedSessionDescriptorSharedData): Promise<void>;
}
