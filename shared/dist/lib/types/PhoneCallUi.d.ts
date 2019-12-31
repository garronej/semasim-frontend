import * as types from "../types/userSim";
import * as wd from "../types/webphoneData/types";
declare type SyncEvent<T> = import("ts-events-extended").SyncEvent<T>;
declare type Observable<T> = import("../../tools/Observable").Observable<T>;
export declare type PhoneCallUi = {
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
            prUserInput: Promise<{
                userAction: "HANGUP";
            }>;
        };
        prUserInput: Promise<{
            userAction: "CANCEL";
        }>;
    }>;
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
    type CreateFactory = (params: CreateFactory.Params) => Promise<Create>;
    namespace CreateFactory {
        type Params = Params.Browser | Params.ReactNative;
        namespace Params {
            type Browser = {
                assertJsRuntimeEnv: "browser";
            };
            type ReactNative = {
                assertJsRuntimeEnv: "react-native";
                userSims: types.UserSim.Usable[];
            };
        }
    }
    type Create = (params: Create.Params) => PhoneCallUi;
    namespace Create {
        type Params = Params.Browser | Params.ReactNative;
        namespace Params {
            type _Common = {
                userSim: types.UserSim.Usable;
            };
            type Browser = _Common & {
                assertJsRuntimeEnv: "browser";
            };
            type ReactNative = _Common & {
                assertJsRuntimeEnv: "react-native";
                obsIsSipRegistered: Observable<boolean>;
            };
        }
    }
}
export {};
