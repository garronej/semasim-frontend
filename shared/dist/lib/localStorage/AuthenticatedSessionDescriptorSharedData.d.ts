export declare type AuthenticatedSessionDescriptorSharedData = {
    connect_sid: string;
    email: string;
    uaInstanceId: string;
    encryptedSymmetricKey: string;
};
export declare namespace AuthenticatedSessionDescriptorSharedData {
    /** Can be used to track when the user is logged in */
    const evtChange: import("evt/dist/lib/types").Evt<AuthenticatedSessionDescriptorSharedData | undefined>;
    function isPresent(): Promise<boolean>;
    function remove(): Promise<void>;
    /** assert isPresent */
    function get(): Promise<AuthenticatedSessionDescriptorSharedData>;
    function set(authenticatedSessionDescriptorSharedData: AuthenticatedSessionDescriptorSharedData): Promise<void>;
}
