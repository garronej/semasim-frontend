import * as sip from "ts-sip";
import { SyncEvent } from "ts-events-extended";
/** semasim.com or dev.semasim.com */
export declare const baseDomain: string;
export declare const url: string;
export declare const evtConnect: SyncEvent<sip.Socket>;
/** Called from outside isReconnect should never be passed */
export declare function connect(requestTurnCred?: "REQUEST TURN CRED" | undefined, isReconnect?: undefined | "RECONNECT"): void;
export declare function get(): sip.Socket | Promise<sip.Socket>;
