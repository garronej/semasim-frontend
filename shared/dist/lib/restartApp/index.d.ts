import { VoidSyncEvent } from "ts-events-extended";
export declare type Default = (reason: string) => Promise<never>;
export declare const evtAppAboutToRestart: VoidSyncEvent;
export declare const restartApp: Default;
