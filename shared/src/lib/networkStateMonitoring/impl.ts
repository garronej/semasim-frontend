

import { NetworkStateMonitoring, GetApiFn } from "./types";
import { VoidSyncEvent } from "ts-events-extended";


const api: NetworkStateMonitoring = {
    "getIsOnline": ()=> navigator.onLine,
    "evtStateChange": (()=>{

        const out= new VoidSyncEvent();

        window.addEventListener("online", ()=> out.post());
        window.addEventListener("offline", ()=> out.post());

        return out;

    })()
};

export const getApi: GetApiFn = ()=> Promise.resolve(api);
