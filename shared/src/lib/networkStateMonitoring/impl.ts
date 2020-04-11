

import { NetworkStateMonitoring, GetApiFn } from "./types";
import { Evt } from "evt";


const api: NetworkStateMonitoring = {
    "getIsOnline": ()=> navigator.onLine,
    "evtStateChange": (()=>{

        const out= Evt.create();

        window.addEventListener("online", ()=> out.post());
        window.addEventListener("offline", ()=> out.post());

        return out;

    })()
};

export const getApi: GetApiFn = ()=> Promise.resolve(api);
