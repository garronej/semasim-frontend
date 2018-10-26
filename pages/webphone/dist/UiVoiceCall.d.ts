import * as types from "../../../shared/dist/lib/types";
import wd = types.webphoneData;
import { Ua } from "./Ua";
export declare class UiVoiceCall {
    private readonly userSim;
    private readonly structure;
    private readonly countryIso;
    private readonly btnGreen;
    private readonly btnRed;
    private readonly evtBtnClick;
    private readonly evtNumpadDtmf;
    constructor(userSim: types.UserSim.Usable);
    private setContact;
    private setArrows;
    private onEstablished;
    onIncoming(wdChat: wd.Chat): {
        onTerminated(message: string): void;
        prUserInput: Promise<{
            userAction: "ANSWER";
            onEstablished: typeof UiVoiceCall.prototype.onEstablished;
        } | {
            userAction: "REJECT";
        }>;
    };
    onOutgoing(wdChat: wd.Chat): {
        onTerminated(message: string): void;
        onRingback(): {
            onEstablished: typeof UiVoiceCall.prototype.onEstablished;
            prUserInput: Promise<{
                userAction: "HANGUP";
            }>;
        };
        prUserInput: Promise<{
            userAction: "CANCEL";
        }>;
    };
    private state;
    private setState;
}
export declare namespace UiVoiceCall {
    type State = "RINGING" | "RINGBACK" | "ESTABLISHED" | "LOADING" | "TERMINATED";
    type InCallUserAction = InCallUserAction.Dtmf | InCallUserAction.Hangup;
    namespace InCallUserAction {
        type Dtmf = {
            userAction: "DTMF";
            signal: Ua.DtmFSignal;
            duration: number;
        };
        type Hangup = {
            userAction: "HANGUP";
        };
    }
}
