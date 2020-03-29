
//TODO: Incorporate in EVT

import { Evt } from "evt";

export const evtFromPromise = <T>(pr: PromiseLike<T>): Evt<T> => {

    const evt = new Evt<T>();

    pr.then(data => evt.post(data));

    return evt;

}
