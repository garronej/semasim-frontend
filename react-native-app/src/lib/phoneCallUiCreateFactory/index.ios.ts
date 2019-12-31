
import * as types from "frontend-shared/dist/lib/types/userSimAndPhoneCallUi";

const log: typeof console.log = true ?
    ((...args: any[]) => console.log.apply(console, ["[lib/phoneCallUiCreateFactory/index.ios]", ...args])) :
    (() => { });


let hasBeenCalled = false;

export const phoneCallUiCreateFactory: types.PhoneCallUi.CreateFactory = async params => {

    if (hasBeenCalled) {
        throw new Error("Wrong assertion");
    }

    hasBeenCalled = true;

    if (params.assertJsRuntimeEnv === "browser") {
        throw new Error("Wrong assertion");
    }

    throw new Error("TODO: implement");

};