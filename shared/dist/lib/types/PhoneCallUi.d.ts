declare type SyncEvent<T> = import("ts-events-extended").SyncEvent<T>;
declare type Observable<T> = import("ts-events-extended").Observable<T>;
export declare type PhoneCallUi = {
    openUiForOutgoingCall(phoneNumberRaw: string): void;
    openUiForIncomingCall(phoneNumberRaw: string): {
        onTerminated(message: string): void;
        prUserInput: Promise<{
            userAction: "ANSWER";
            onEstablished: PhoneCallUi.OnEstablished;
        } | {
            userAction: "REJECT";
        }>;
    };
    evtUiOpenedForOutgoingCall: SyncEvent<{
        phoneNumberRaw: string;
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
        type Params = {
            sims: {
                imsi: string;
                friendlyName: string;
                phoneNumber: string | undefined;
                serviceProvider: string | undefined;
            }[];
        };
    }
    type Create = (params: Create.Params) => PhoneCallUi;
    namespace Create {
        type Params = Params.Browser | Params.ReactNative;
        namespace Params {
            type _Common = {
                imsi: string;
                getContactName: (phoneNumberRaw: string) => string | undefined;
                getPhoneNumberPrettyPrint: (phoneNumberRaw: string) => string;
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
