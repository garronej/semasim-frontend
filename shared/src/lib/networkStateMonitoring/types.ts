

export type NetworkStateMonitoring = {
    getIsOnline: ()=> boolean;
    evtStateChange: import("evt").VoidEvt;
};

export type GetApiFn= ()=> Promise<NetworkStateMonitoring>;