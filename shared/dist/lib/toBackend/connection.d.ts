import * as sip from "ts-sip";
import { SyncEvent } from "ts-events-extended";
/** semasim.com or dev.semasim.com */
export declare const baseDomain: string;
export declare const url: string;
export declare const evtConnect: SyncEvent<sip.Socket>;
export declare function connect(): void;
export declare function get(): sip.Socket | Promise<sip.Socket>;
