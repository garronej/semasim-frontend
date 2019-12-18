

type ApiExposedByHost = {
    startKeepAlive(): void;
    stopKeepAlive(): void;
};

type ApiExposedToHost = {
};

declare const apiExposedByHost: ApiExposedByHost;

export const apiExposedToHost: ApiExposedToHost = {
};


export function start(): void {

    apiExposedByHost.startKeepAlive();

}

export function stop(): void {

    apiExposedByHost.stopKeepAlive();

}
