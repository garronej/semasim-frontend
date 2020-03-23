declare type Evt<T> = import("evt").Evt<T>;
export declare function runNowAndWhenEventOccurFactory<Evts extends {
    [K in string]: Pick<Evt<any>, "attach">;
}>(evts: Evts): {
    runNowAndWhenEventOccur: (handler: () => void, keys: (keyof Evts)[]) => void;
};
export {};
