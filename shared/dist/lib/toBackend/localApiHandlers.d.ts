import * as sipLibrary from "ts-sip";
import type * as types from "../types/RemoteNotifyEvts";
export declare function getHandlers(): {
    handlers: sipLibrary.api.Server.Handlers;
    remoteNotifyEvts: types.RemoteNotifyEvts;
};
