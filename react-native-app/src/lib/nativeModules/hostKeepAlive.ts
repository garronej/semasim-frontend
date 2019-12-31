

const log: typeof console.log = true ?
    ((...args: any[]) => console.log(...["[lib/nativeModules/hostKeepAlive]", ...args])) :
    (() => { });

type ApiExposedByHost = {
    runHeadlessTask(): void;
};

type ApiExposedToHost = {
};

declare const apiExposedByHost: ApiExposedByHost;

export const apiExposedToHost: ApiExposedToHost = {
};

let prResolve: (()=> void) | undefined = undefined;


export function start(): void {

    if( prResolve !== undefined ){
        return;
    }

    apiExposedByHost.runHeadlessTask();

}


export function stop(): void {

    prResolve?.();

    prResolve= undefined;

}

export function doHeadlessTaskRegistering(
    registerHeadlessTask: typeof import("react-native").AppRegistry["registerHeadlessTask"]
) {


    registerHeadlessTask(
        "HostKeepAliveTask",
        () => () => {
            
            if( prResolve !== undefined ){
                return Promise.resolve();
            }

            return new Promise<void>(resolve => prResolve = resolve);

        }

    );

}



/*
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
*/
