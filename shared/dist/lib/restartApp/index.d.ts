export declare type RestartApp = (reason: string) => Promise<never>;
export declare function registerActionToPerformBeforeAppRestart(action: () => void | Promise<void>): void;
export declare const restartApp: RestartApp;
