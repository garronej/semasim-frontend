
declare const require: any;

import { NetworkStateMonitoring, GetApiFn } from "./types";
import { VoidSyncEvent } from "ts-events-extended";
const NetInfo: typeof import("../../../../react-native-app/node_modules/@react-native-community/netinfo") = require("@react-native-community/netinfo");
type NetInfoState = import("../../../../react-native-app/node_modules/@react-native-community/netinfo").NetInfoState;

const isOnlineFromState = ({ isInternetReachable, isConnected }: NetInfoState) =>
    isInternetReachable === null ? isConnected : isInternetReachable;

let api: NetworkStateMonitoring | undefined = undefined;

export const getApi: GetApiFn = async () => {

    if (api !== undefined) {
        return api;
    }

    let isOnLine = isOnlineFromState(await NetInfo.fetch());

    api = {
        "getIsOnline": () => isOnLine,
        "evtStateChange": (() => {

            const out = new VoidSyncEvent();

            NetInfo.addEventListener(state => {

                const newIsOnLine = isOnlineFromState(state);

                if (newIsOnLine === isOnLine) {
                    return;
                }

                isOnLine = newIsOnLine;

                out.post();


            });

            return out;

        })()
    };

    return getApi();

};


