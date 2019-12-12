import * as core from "./core";
import * as webphoneData from "./webphoneData";
import { sendRequest } from "./sendRequest";
import { appEvts } from "../appEvts";

const getWdApiCallerForSpecificSimFactory = (encryptorDecryptor: import("../../crypto/cryptoLibProxy").EncryptorDecryptor, userEmail: string) =>
    webphoneData.getApiCallerForSpecificSimFactory(sendRequest, appEvts, encryptorDecryptor, userEmail)
    ;

export { core, getWdApiCallerForSpecificSimFactory };

export type RemoteCoreApiCaller = typeof core;

export type SubsetOfRemoteCoreApiCaller<K extends keyof RemoteCoreApiCaller> = Pick<RemoteCoreApiCaller, K>;

