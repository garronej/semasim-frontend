
type ApiExposedByHost = {
    setMicrophoneMute(isMicrophoneMute: boolean): void;
};

type ApiExposedToHost = {};

declare const apiExposedByHost: ApiExposedByHost;

export const apiExposedToHost: ApiExposedToHost = {};

export function setMicrophoneMute(
    isMicrophoneMute: boolean
): void {

    apiExposedByHost.setMicrophoneMute(isMicrophoneMute);

}
