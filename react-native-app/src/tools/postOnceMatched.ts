
import { SyncEvent } from "frontend-shared/node_modules/ts-events-extended";

export async function postOnceMatched<T>(evt: SyncEvent<T>, eventData: T){

    if (!evt.getHandlers().find(handler => handler.matcher(eventData))) {

        await evt.evtAttach.waitFor(handler => handler.matcher(eventData));

    }

    evt.post(eventData);

}