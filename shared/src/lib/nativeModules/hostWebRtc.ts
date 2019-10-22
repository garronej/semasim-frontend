
import { 
    overrideWebRTCImplementation, Methods, Listeners 
} from "../../tools/overrideWebRTCImplementation";

type ApiExposedByHost = Methods;

type ApiExposedToHost = Listeners;

declare const apiExposedByHost: ApiExposedByHost;

export const apiExposedToHost: ApiExposedToHost = overrideWebRTCImplementation(apiExposedByHost);
