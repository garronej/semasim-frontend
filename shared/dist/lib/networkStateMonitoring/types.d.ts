export declare type NetworkStateMonitoring = {
    getIsOnline: () => boolean;
    evtStateChange: import("evt").VoidEvt;
};
export declare type GetApiFn = () => Promise<NetworkStateMonitoring>;
