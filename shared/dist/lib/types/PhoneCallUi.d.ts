declare type Evt<T> = import("evt").Evt<T>;
declare type IObservable<T> = import("evt/dist/lib/Observable").IObservable<T>;
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
    evtUiOpenedForOutgoingCall: Evt<{
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
    type DtmFSignal = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "*" | "#";
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
        evtUserInput: Evt<PhoneCallUi.InCallUserAction>;
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
                obsIsSipRegistered: IObservable<boolean>;
            };
        }
    }
}
export {};
