import * as sip from "ts-sip";
import { SyncEvent } from "ts-events-extended";
export declare const url: string;
declare namespace notConnectedUserFeedback {
    export type State = {
        isVisible: true;
        message: string;
    } | {
        isVisible: false;
    };
    let setVisibilityWithMessage: (state: State) => void;
    export function setVisibility(isVisible: boolean): void;
    export function provideCustomImplementation(setVisibilityWithMessageImpl: typeof setVisibilityWithMessage): void;
    export {};
}
export declare type ConnectParams = ConnectParams.Browser | ConnectParams.ReactNative;
export declare namespace ConnectParams {
    type _Common = {
        requestTurnCred: boolean;
    };
    type Browser = _Common & {
        assertJsRuntimeEnv: "browser";
    };
    type ReactNative = _Common & {
        assertJsRuntimeEnv: "react-native";
        notConnectedUserFeedback: (state: notConnectedUserFeedback.State) => void;
    };
}
/** login is called when the user
 * is no longer logged in, it should return a Promise
 * that resolve when the user is logged back in
 * if not provided and if in browser the page will be reloaded
 * else error will be thrown.
 */
export declare const connect: (params: ConnectParams) => void;
export declare const evtConnect: SyncEvent<sip.Socket>;
export declare function get(): sip.Socket | Promise<sip.Socket>;
export {};
