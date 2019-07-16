
import { overrideWebRTCImplementation, Methods, Listeners } from "../../../shared/dist/tools/overrideWebRTCImplementation";

export type ApiExposedByHost = Methods;

declare const apiExposedByHost: ApiExposedByHost;

export type ApiExposedToHost = Listeners;

export const apiExposedToHost: ApiExposedToHost = overrideWebRTCImplementation(apiExposedByHost);
