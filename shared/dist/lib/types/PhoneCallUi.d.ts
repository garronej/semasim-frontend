import * as types from "../types/userSim";
import * as wd from "../types/webphoneData/types";
declare type SyncEvent<T> = import("ts-events-extended").SyncEvent<T>;
declare type Observable<T> = import("../../tools/Observable").Observable<T>;
export declare type PhoneCallUi = {
    onOutgoing(wdChat: wd.Chat<"PLAIN">): {
        onTerminated(message: string): void;
        onRingback(): {
            onEstablished: PhoneCallUi.OnEstablished;
            prUserInput: Promise<{
                userAction: "HANGUP";
            }>;
        };
        prUserInput: Promise<{
            userAction: "CANCEL";
        }>;
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
};
export declare namespace PhoneCallUi {
    type DtmFSignal = import("../sipUserAgent").DtmFSignal;
    type InCallUserAction = InCallUserAction.Dtmf | InCallUserAction.Hangup;
    namespace InCallUserAction {
        type Dtmf = {
            userAction: "DTMF";
            signal: DtmFSignal;
            duration: number;
        };
        type Hangup = {
            userAction: "HANGUP";
        };
    }
    type OnEstablished = () => {
        evtUserInput: SyncEvent<PhoneCallUi.InCallUserAction>;
    };
    type CreateFactory = (params: CreateFactory.Params) => Promise<(userSim: types.UserSim.Usable) => PhoneCallUi>;
    namespace CreateFactory {
        type Params = Params.Browser | Params.ReactNative;
        namespace Params {
            type Browser = {
                assertJsRuntimeEnv: "browser";
            };
            type ReactNative = {
                assertJsRuntimeEnv: "react-native";
                obsIsAtLeastOneSipRegistration: Observable<boolean>;
            };
        }
    }
}
export {};
