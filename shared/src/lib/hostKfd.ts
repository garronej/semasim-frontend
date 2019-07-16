
import * as cryptoLib from "crypto-lib";
import * as crypto from "./crypto";
import { SyncEvent } from "ts-events-extended";
declare const Buffer: any;

export type ApiExposedByHost = {
	kfd(password: string, saltHex: string, iterations: number, callRef: number): void;
};

declare const apiExposedByHost: ApiExposedByHost;

export type ApiExposedToHost = {
	onKfdComputed(callRef: number, resultHex: string): void;
};

const evtKfdComputed = new SyncEvent<{
	callRef: number;
	resultHex: string;
}>();

export const apiExposedToHost: ApiExposedToHost = {
	"onKfdComputed": (callRef, resultHex) => evtKfdComputed.post({ callRef, resultHex })
};

const getCounter = (() => {

	let counter = 0;

	return () => counter++;

})();

export const kfd: crypto.computeLoginSecretAndTowardUserKeys.Kfd | undefined =
	typeof apiExposedByHost === "undefined" ?
		undefined :
		(async (password, salt) => {

			const callRef = getCounter();

			apiExposedByHost.kfd(
				password,
				cryptoLib.toBuffer(salt).toString("hex"),
				crypto.computeLoginSecretAndTowardUserKeys.kfdIterations,
				callRef
			);

			const { resultHex } = await evtKfdComputed.waitFor(
				({ callRef: callRef_ }) => callRef_ === callRef
			);

			return Buffer.from(resultHex, "hex");

		})
	;