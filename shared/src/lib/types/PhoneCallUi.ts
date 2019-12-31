


import * as types from "../types/userSim";
import * as wd from "../types/webphoneData/types";
type SyncEvent<T> = import("ts-events-extended").SyncEvent<T>;
type Observable<T> = import("../../tools/Observable").Observable<T>;

export type PhoneCallUi = {
    openUiForOutgoingCall(wdChat: wd.Chat<"PLAIN">): void;
    openUiForIncomingCall(wdChat: wd.Chat<"PLAIN">): {
        onTerminated(message: string): void;
        prUserInput: Promise<{
            userAction: "ANSWER";
            onEstablished: PhoneCallUi.OnEstablished;
        } | {
            userAction: "REJECT";
        }>;
    };
    evtUiOpenedForOutgoingCall: SyncEvent<{
        phoneNumber: string;
        onTerminated(message: string): void;
        onRingback(): {
            onEstablished: PhoneCallUi.OnEstablished;
            prUserInput: Promise<{ userAction: "HANGUP"; }>;
        };
        prUserInput: Promise<{ userAction: "CANCEL"; }>;
    }>;
}


export namespace PhoneCallUi {

    export type DtmFSignal = import("../sipUserAgent").DtmFSignal;

    export type InCallUserAction =
        InCallUserAction.Dtmf |
        InCallUserAction.Hangup;

    export namespace InCallUserAction {

        export type Dtmf = {
            userAction: "DTMF";
            signal: DtmFSignal;
            duration: number;
        };

        export type Hangup = {
            userAction: "HANGUP";
        };

    }

    export type OnEstablished = () => { evtUserInput: SyncEvent<PhoneCallUi.InCallUserAction> };


    export type CreateFactory = (params: CreateFactory.Params) =>
        Promise<Create>
        ;

    export namespace CreateFactory {

        export type Params = Params.Browser | Params.ReactNative;

        export namespace Params {

            export type Browser = {
                assertJsRuntimeEnv: "browser";
            };

            export type ReactNative = {
                assertJsRuntimeEnv: "react-native";
                userSims: types.UserSim.Usable[];
            };

        }


    }

    export type Create = (params: Create.Params) => PhoneCallUi;

    export namespace Create {

        export type Params = Params.Browser | Params.ReactNative;

        export namespace Params {

            export type _Common = {
                userSim: types.UserSim.Usable;
            };

            export type Browser = _Common & {
                assertJsRuntimeEnv: "browser";
            };

            export type ReactNative = _Common & {
                assertJsRuntimeEnv: "react-native";
                obsIsSipRegistered: Observable<boolean>;
            };

        }

    }


}

