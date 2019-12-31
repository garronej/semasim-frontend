
import { SyncEvent } from "frontend-shared/node_modules/ts-events-extended";
import { postOnceMatched } from "../../tools/postOnceMatched";

const log: typeof console.log = true ?
    ((...args: any[]) => console.log(...["[lib/nativeModules/hostPhoneCallUi]", ...args])) :
    (() => { });

type ApiExposedByHost = {

    openPhoneAccountSettings(callRef: number): void;
    setIsPhoneAccountSipRegistered(imsi: string, isPhoneAccountSipRegistered: boolean, callRef: number): void;
    registerOrUpdatePhoneAccount(imsi: string, friendlyName: string, serviceProvider: string, phoneNumber: string | null, callRef: number): void;
    getIsSimPhoneAccountEnabled(imsi: string, callRef: number): void;
    unregisterOtherPhoneAccounts(imsisJson: string, callRef: number): void;

    placeCall(phoneCallRef: number, imsi: string, phoneNumber: string, contactName: string): void;
    setCallActive(phoneCallRef: number): void;
    reportCallTerminated(phoneCallRef: number): void;

};

type ApiExposedToHost = {

    onOpenPhoneAccountSettingsResult(callRef: number): void;
    onSetIsPhoneAccountSipRegisteredResult(callRef: number): void;
    onRegisterOrUpdatePhoneAccountResult(callRef: number): void;
    onGetIsSimPhoneAccountEnabledResult(callRef: number, isSimPhoneAccountEnabled: boolean): void;
    onUnregisterOtherPhoneAccountsResult(callRef: number): void;

    notifyCallAnswered(phoneCallRef: number): void;
    notifyDtmf(phoneCallRef: number, dtmf: string): void;
    notifyEndCall(phoneCallRef: number): void;
    notifyUiOpenForOutgoingCall(phoneCallRef: number, imsi: string, phoneNumber: string): void;




};

declare const apiExposedByHost: ApiExposedByHost;


const evtOpenPhoneAccountSettingsResult = new SyncEvent<{ callRef: number; }>();
const evtSetIsPhoneAccountSipRegisteredResult = new SyncEvent<{ callRef: number; }>();
const evtRegisterOrUpdatePhoneAccountResult = new SyncEvent<{ callRef: number; }>();
const evtGetIsSimPhoneAccountEnabledResult = new SyncEvent<{ callRef: number; isSimPhoneAccountEnabled: boolean; }>();
const evtUnregisterOtherPhoneAccountsResult = new SyncEvent<{ callRef: number; }>();

export const evtUiOpenForOutgoingCall = new SyncEvent<{
    phoneCallRef: number;
    imsi: string;
    phoneNumber: string;
}>();

export const evtCallAnswered = new SyncEvent<{ phoneCallRef: number; }>();
export const evtDtmf = new SyncEvent<{ phoneCallRef: number; dtmf: string; }>();
export const evtEndCall = new SyncEvent<{ phoneCallRef: number; }>();


export const apiExposedToHost: ApiExposedToHost = {

    "onOpenPhoneAccountSettingsResult": callRef =>
        evtOpenPhoneAccountSettingsResult.post({ callRef }),
    "onSetIsPhoneAccountSipRegisteredResult": callRef =>
        evtSetIsPhoneAccountSipRegisteredResult.post({ callRef }),
    "onRegisterOrUpdatePhoneAccountResult": callRef =>
        evtRegisterOrUpdatePhoneAccountResult.post({ callRef }),
    "onGetIsSimPhoneAccountEnabledResult": (callRef, isSimPhoneAccountEnabled) =>
        evtGetIsSimPhoneAccountEnabledResult.post({ callRef, isSimPhoneAccountEnabled }),
    "onUnregisterOtherPhoneAccountsResult": callRef =>
        evtUnregisterOtherPhoneAccountsResult.post({ callRef }),
    "notifyCallAnswered": phoneCallRef =>
        evtCallAnswered.post({ phoneCallRef }),
    "notifyDtmf": (phoneCallRef, dtmf) =>
        evtDtmf.post({ phoneCallRef, dtmf }),
    "notifyEndCall": phoneCallRef =>
        evtEndCall.post({ phoneCallRef }),
    "notifyUiOpenForOutgoingCall": (phoneCallRef, imsi, phoneNumber) =>
        postOnceMatched(evtUiOpenForOutgoingCall, { phoneCallRef, imsi, phoneNumber })

};


const getCounter = (() => {

    let counter = 0;

    return () => counter++;

})();


export async function openPhoneAccountSettings(): Promise<void> {

    const callRef = getCounter();

    apiExposedByHost.openPhoneAccountSettings(callRef);

    await evtOpenPhoneAccountSettingsResult.waitFor(
        ({ callRef: callRef_ }) => callRef_ === callRef
    );

}

export async function setIsPhoneAccountSipRegistered(
    imsi: string,
    isPhoneAccountSipRegistered: boolean
): Promise<void> {

    const callRef = getCounter();

    apiExposedByHost.setIsPhoneAccountSipRegistered(imsi, isPhoneAccountSipRegistered, callRef);

    await evtSetIsPhoneAccountSipRegisteredResult.waitFor(
        ({ callRef: callRef_ }) => callRef_ === callRef
    );

}

export async function registerOrUpdatePhoneAccount(
    imsi: string,
    friendlyName: string,
    serviceProvider: string,
    phoneNumber: string | null
): Promise<void> {

    const callRef = getCounter();

    apiExposedByHost.registerOrUpdatePhoneAccount(imsi, friendlyName, serviceProvider, phoneNumber, callRef);

    await evtRegisterOrUpdatePhoneAccountResult.waitFor(
        ({ callRef: callRef_ }) => callRef_ === callRef
    );

}

export async function getIsSimPhoneAccountEnabled(imsi: string): Promise<boolean> {

    const callRef = getCounter();

    apiExposedByHost.getIsSimPhoneAccountEnabled(imsi, callRef);

    const { isSimPhoneAccountEnabled } = await evtGetIsSimPhoneAccountEnabledResult.waitFor(
        ({ callRef: callRef_ }) => callRef_ === callRef
    );

    return isSimPhoneAccountEnabled;

}
export async function unregisterOtherPhoneAccounts(imsis: string[]): Promise<void> {

    const callRef = getCounter();

    apiExposedByHost.unregisterOtherPhoneAccounts(
        JSON.stringify(imsis), 
        callRef
    );

    await evtGetIsSimPhoneAccountEnabledResult.waitFor(
        ({ callRef: callRef_ }) => callRef_ === callRef
    );

}

export function placeCall(phoneCallRef: number, imsi: string, phoneNumber: string, contactName: string): void {
    apiExposedByHost.placeCall(phoneCallRef, imsi, phoneNumber, contactName);
}

export function setCallActive(phoneCallRef: number): void {
    apiExposedByHost.setCallActive(phoneCallRef);
}

export function reportCallTerminated(phoneCallRef: number): void {
    apiExposedByHost.reportCallTerminated(phoneCallRef);
}

