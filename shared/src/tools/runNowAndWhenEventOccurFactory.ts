
type Evt<T> = import("evt").Evt<T>;

export function runNowAndWhenEventOccurFactory<Evts extends { [K in string]: Pick<Evt<any>, "attach">; }>(
    evts: Evts
) {

    function runNowAndWhenEventOccur(
        handler: () => void,
        keys: (keyof Evts)[]
    ) {

        keys.forEach(key => evts[key].attach(handler));

        handler();

    };

    return { runNowAndWhenEventOccur };

}