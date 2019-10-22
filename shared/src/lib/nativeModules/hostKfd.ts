
import { SyncEvent } from "ts-events-extended";

export type ApiExposedByHost = {
	kfd(password: string, saltHex: string, iterations: number, callRef: number): void;
};

export type ApiExposedToHost = {
	onKfdResult(callRef: number, resultHex: string): void;
};

declare const apiExposedByHost: ApiExposedByHost;

const evtKfdResult = new SyncEvent<{
	callRef: number;
	resultHex: string;
}>();

export const apiExposedToHost: ApiExposedToHost = {
	"onKfdResult": (callRef, resultHex) => evtKfdResult.post({ callRef, resultHex })
};

const getCounter = (() => {

	let counter = 0;

	return () => counter++;

})();

export async function kfd(
	password: string, 
	saltHex: string, 
	iterations: number
): Promise<{ resultHex: string; }> {

	const callRef = getCounter();

	apiExposedByHost.kfd(
		password,
		saltHex,
		iterations,
		callRef
	);

	const { resultHex } = await evtKfdResult.waitFor(
		({ callRef: callRef_ }) => callRef_ === callRef
	);

	return { resultHex };

};




