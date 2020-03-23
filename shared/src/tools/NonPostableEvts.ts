//TODO: Include in evt

import { NonPostable, EvtLike } from "evt";

export type NonPostableEvts<T extends { [evtName: string]: any; }> = {
	[P in keyof T]: T[P] extends EvtLike<any> ? NonPostable<T[P]> : T[P];
};

/*
type Evt<T> = import("evt").Evt<T>;

const x: NonPostableEvts<{
	a: string;
	b: number; 
	c: Evt<string>;
	d: NonPostable<Evt<number>>
}>= null as any; x;
*/




