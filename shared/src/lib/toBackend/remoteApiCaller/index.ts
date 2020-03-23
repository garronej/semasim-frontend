import * as core from "./core";
import * as webphoneData from "./webphoneData";
import { getSendRequest } from "./getSendRequest";

export { CoreApi } from "./core";
export { WdApi } from "./webphoneData";

type ConnectionApi = Pick<import("../connection").ConnectionApi, "getSocket"> &
{ remoteNotifyEvts: webphoneData.RemoteNotifyEvts & core.RemoteNotifyEvts }
    ;

export function factory(
    params: {
        connectionApi: ConnectionApi;
        restartApp: import("../../restartApp").RestartApp;
    }
) {

    const { connectionApi, restartApp } = params;

    const sendRequest = getSendRequest(connectionApi, restartApp);

    return {
        "getWdApiFactory": ({
            encryptorDecryptor,
            userEmail
        }: { encryptorDecryptor: import("../../crypto/cryptoLibProxy").EncryptorDecryptor; userEmail: string; }) =>
            webphoneData.getWdApiFactory({
                sendRequest,
                "remoteNotifyEvts": connectionApi.remoteNotifyEvts,
                encryptorDecryptor,
                userEmail
            }),
        "getCoreApi": ({ userEmail }: {userEmail: string;}) =>
            core.getCoreApi(sendRequest, connectionApi.remoteNotifyEvts, restartApp, userEmail)
    };

}

