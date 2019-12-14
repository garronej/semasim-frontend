
import * as types from "../types/userSim";
import * as wd from "../types/webphoneData/types";
type SyncEvent<T> = import("ts-events-extended").SyncEvent<T>;
type Observable<T> = import("../../tools/Observable").Observable<T>;



export type PhoneCallUi = {
    onOutgoing(wdChat: wd.Chat<"PLAIN">): {
        onTerminated(message: string): void;
        onRingback(): {
            onEstablished: PhoneCallUi.OnEstablished;
            prUserInput: Promise<{ userAction: "HANGUP"; }>;
        };
        prUserInput: Promise<{ userAction: "CANCEL"; }>;
    };
    onIncoming(wdChat: wd.Chat<"PLAIN">): {
        onTerminated(message: string): void;
        prUserInput: Promise<{
            userAction: "ANSWER";
            onEstablished: PhoneCallUi.OnEstablished;
        } | {
            userAction: "REJECT";
        }>;
    };
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
        Promise<(userSim: types.UserSim.Usable) => PhoneCallUi>
        ;

    export namespace CreateFactory {

        export type Params = Params.Browser | Params.ReactNative;

        export namespace Params {

            export type Browser = {
                assertJsRuntimeEnv: "browser";
            };

            export type ReactNative = {
                assertJsRuntimeEnv: "react-native";
                obsIsAtLeastOneSipRegistration: Observable<boolean>;
            };

        }

    }


}



