import { NonPostable, EvtLike } from "evt";
export declare type NonPostableEvts<T extends {
    [evtName: string]: any;
}> = {
    [P in keyof T]: T[P] extends EvtLike<any> ? NonPostable<T[P]> : T[P];
};
