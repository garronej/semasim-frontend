

export type NetworkStateMonitoring = {
    getIsOnline: ()=> boolean;
    evtStateChange: import("ts-events-extended").VoidSyncEvent;
};

export type GetApiFn= ()=> Promise<NetworkStateMonitoring>;