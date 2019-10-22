export declare type NetworkStateMonitoring = {
    getIsOnline: () => boolean;
    evtStateChange: import("ts-events-extended").VoidSyncEvent;
};
export declare type GetApiFn = () => Promise<NetworkStateMonitoring>;
