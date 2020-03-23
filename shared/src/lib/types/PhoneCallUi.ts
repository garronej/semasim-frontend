
type Evt<T> = import("evt").Evt<T>;
type IObservable<T> = import("evt/dist/lib/Observable").IObservable<T>;

export type PhoneCallUi = {
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
            prUserInput: Promise<{ userAction: "HANGUP"; }>;
        };
        prUserInput: Promise<{ userAction: "CANCEL"; }>;
    }>;
}


export namespace PhoneCallUi {

    export type DtmFSignal = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "*" | "#";

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

    export type OnEstablished = () => { evtUserInput: Evt<PhoneCallUi.InCallUserAction> };


    export type CreateFactory = (params: CreateFactory.Params) =>
        Promise<Create>
        ;

    export namespace CreateFactory {

        export type Params = {
                sims: {
                    imsi: string;
                    friendlyName: string;
                    phoneNumber: string | undefined; //NOTE: formated
                    serviceProvider: string | undefined;
                }[]
        };

    }

    export type Create = (params: Create.Params) => PhoneCallUi;

    export namespace Create {

        export type Params = Params.Browser | Params.ReactNative;

        export namespace Params {

            export type _Common = {
                imsi: string;
                getContactName: (phoneNumberRaw: string) => string | undefined;
                getPhoneNumberPrettyPrint: (phoneNumberRaw: string) => string;
            };

            export type Browser = _Common & {
                assertJsRuntimeEnv: "browser";
            };

            export type ReactNative = _Common & {
                assertJsRuntimeEnv: "react-native";
                obsIsSipRegistered: IObservable<boolean>;
            };

        }

    }


}

