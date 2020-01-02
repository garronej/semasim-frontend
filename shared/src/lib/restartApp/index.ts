
import { VoidSyncEvent } from "ts-events-extended";

export type Default = (reason: string)=>Promise<never>;

import * as impl from "./impl";

export const evtAppAboutToRestart= new VoidSyncEvent();

export const restartApp: Default = (...args) => {

    evtAppAboutToRestart.post();

    return impl.default(...args);

};



