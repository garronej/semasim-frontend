

import { NetworkStateMonitoring, GetApiFn } from "./types";
import { VoidEvt } from "evt";


const api: NetworkStateMonitoring = {
    "getIsOnline": ()=> navigator.onLine,
    "evtStateChange": (()=>{

        const out= new VoidEvt();

        window.addEventListener("online", ()=> out.post());
        window.addEventListener("offline", ()=> out.post());

        return out;

    })()
};

export const getApi: GetApiFn = ()=> Promise.resolve(api);
