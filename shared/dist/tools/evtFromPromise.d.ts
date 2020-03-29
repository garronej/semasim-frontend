import { Evt } from "evt";
export declare const evtFromPromise: <T>(pr: PromiseLike<T>) => Evt<T>;
