import * as sip from "ts-sip";
import { SyncEvent } from "ts-events-extended";
import * as cookies from "../cookies/logic/frontend";
export declare const url: string;
export declare const evtConnect: SyncEvent<sip.Socket>;
/**
 * - Multiple auxiliary connection can be established at the same time.
 * - On the contrary only one main connection can be active at the same time for a given user account )
 * - Auxiliary connections does not receive most of the events defined in localApiHandler.
 *   But will receive notifyIceServer ( if requestTurnCred === true ).
 * - Auxiliary connections will not receive phonebook entries
 * ( userSims will appear as if they had no contacts stored )
 *
 * Called from outside isReconnect should never be passed.
 *  */
export declare function connect(connectionParams: cookies.WebsocketConnectionParams, isReconnect?: undefined | "RECONNECT"): void;
export declare function get(): sip.Socket | Promise<sip.Socket>;
