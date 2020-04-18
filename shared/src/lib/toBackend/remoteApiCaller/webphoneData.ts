
import * as apiDeclaration from "../../../sip_api_declarations/backendToUa";
import { types as gwTypes } from "../../../gateway/types";
import { phoneNumber } from "phone-number/dist/lib";
import * as md5 from "md5";
import * as cryptoLib from "../../crypto/cryptoLibProxy";
import { Evt, UnpackEvt, ToPostableEvt } from "evt";
import { createObjectWithGivenRef } from "../../../tools/createObjectWithGivenRef";
import { id } from "../../../tools/typeSafety/id";
import { assert } from "../../../tools/typeSafety";
import { decryptThenParseFactory } from "crypto-lib/dist/async/serializer";
import * as types from "../../types";

const hash: (str: string) => string = md5;


type RequestProcessedByBackend = UnpackEvt<types.RemoteNotifyEvts["evtWdActionFromOtherUa"]>;

//NOTE: Understand Pick<import("../../types/AppEvts").AppEvts, "evtWdActionFromOtherUa">, modified for tests.
export type RemoteNotifyEvts = {
    evtWdActionFromOtherUa: Evt<
        RequestProcessedByBackend &
        { handlerCb?: (error?: Error) => void }
    >;
};

//NOTE: time and direction are plain in db, ref does not need to be secure.
const buildWdMessageRef = (
    time: number,
    direction: "INCOMING" | "OUTGOING"
): string => hash(`${time}${direction}`);


/** Inject send request only when testing */
export function getWdApiFactory(
    params: {
        sendRequest: ReturnType<typeof import("./getSendRequest").getSendRequest>,
        remoteNotifyEvts: RemoteNotifyEvts,
        encryptorDecryptor: cryptoLib.EncryptorDecryptor,
        userEmail: string;
    }
) {

    const { sendRequest, remoteNotifyEvts, encryptorDecryptor, userEmail } = params;

    const decryptChat = types.wd.Chat.decryptFactory({ decryptThenParseFactory });
    const decryptMessage = types.wd.Message.decryptFactory({ decryptThenParseFactory });

    const stringifyThenEncrypt = cryptoLib.stringifyThenEncryptFactory(encryptorDecryptor);

    const evtRequestProcessedByBackend: RemoteNotifyEvts["evtWdActionFromOtherUa"] = new Evt();

    evtRequestProcessedByBackend.setMaxHandlers(50);

    const onRequestProcessedByBackend = async (requestProcessedByBackend: RequestProcessedByBackend) =>
        new Promise<void>((resolve, reject) => {

            let count = 0;

            const evtData: UnpackEvt<typeof evtRequestProcessedByBackend> = {
                ...requestProcessedByBackend,
                "handlerCb": error => {

                    if (!!error) {
                        reject(error);
                        return;
                    }

                    count++;

                    if (handlerCount !== count) {
                        return;

                    }

                    resolve();

                }
            };

            const handlerCount = evtRequestProcessedByBackend
                .getHandlers()
                .filter(
                    ({ op }) => !!evtRequestProcessedByBackend
                        .getStatelessOp(op)(evtData)
                )
                .length
                ;

            assert(handlerCount !== 0);

            evtRequestProcessedByBackend.post(evtData);

        });

    remoteNotifyEvts.evtWdActionFromOtherUa.attach(
        evtData => evtRequestProcessedByBackend.post(evtData)
    );

    const getGetWdEvts = getGetGetWdEvts({
        encryptorDecryptor,
        evtRequestProcessedByBackend,
        decryptMessage
    });

    return function getWdApi({ imsi }: { imsi: string; }) {

        const getWdEvts = getGetWdEvts(imsi);

        const wdApi = {
            "getUserSimChats": (() => {

                const { methodName } = apiDeclaration.wd_getUserSimChats;
                type Params = apiDeclaration.wd_getUserSimChats.Params;
                type Response = apiDeclaration.wd_getUserSimChats.Response;

                return async function ({ maxMessageCountByChat }: { maxMessageCountByChat: number; }): Promise<{
                    wdChats: types.wd.Chat[];
                    wdEvts: types.wd.Evts
                }> {

                    const wdEncryptedChats = await sendRequest<Params, Response>(
                        methodName,
                        { imsi, maxMessageCountByChat }
                    );

                    const wdChats = await Promise.all(
                        wdEncryptedChats.map(
                            chat => decryptChat({
                                "decryptor": encryptorDecryptor,
                                chat
                            })
                        )
                    );

                    for (const wdChat of wdChats) {

                        wdChat.messages.sort(types.wd.Message.compare);

                    }

                    return { wdChats, "wdEvts": getWdEvts(wdChats) };

                };

            })(),
            /** If there is already a chat with the contact number nothing will be done */
            "newChat": (() => {

                const { methodName } = apiDeclaration.wd_newChat;
                type Params = apiDeclaration.wd_newChat.Params;
                type Response = apiDeclaration.wd_newChat.Response;

                return async function ({ wdChats, contactNumber, contactName, contactIndexInSim }: {
                    wdChats: types.wd.Chat[];
                    contactNumber: phoneNumber;
                    contactName: string;
                    contactIndexInSim: number | null;
                }): Promise<void> {

                    //TODO: Use a stronger hash, md5 can easily be brute-forced, leak contactNumber.
                    const chatRef = hash(`${imsi}${contactNumber}`);

                    if (!!wdChats.find(({ ref }) => ref === chatRef)) {
                        return;
                    }

                    const params: Params = await (async () => {

                        const [
                            encryptedContactNumber,
                            encryptedContactName,
                            encryptedContactIndexInSim
                        ] = await Promise.all(
                            [contactNumber, contactName, contactIndexInSim]
                                .map(v => stringifyThenEncrypt(v))
                        );

                        return {
                            imsi,
                            chatRef,
                            "contactNumber": { "encrypted_string": encryptedContactNumber },
                            "contactName": { "encrypted_string": encryptedContactName },
                            "contactIndexInSim": { "encrypted_number_or_null": encryptedContactIndexInSim }
                        };

                    })();

                    await sendRequest<Params, Response>(
                        methodName,
                        params
                    );

                    await onRequestProcessedByBackend({ methodName, params });

                }


            })(),
            "fetchOlderMessages": (() => {

                const { methodName } = apiDeclaration.wd_fetchOlderMessages;
                type Params = apiDeclaration.wd_fetchOlderMessages.Params;
                type Response = apiDeclaration.wd_fetchOlderMessages.Response;

                return async function ({ wdChat, maxMessageCount }: {
                    wdChat: types.wd.Chat;
                    maxMessageCount: number;
                }): Promise<types.wd.Message[]> {

                    const wdMessages = wdChat.messages;

                    if (wdMessages.length === 0) {
                        return [];
                    }

                    const olderThanMessage = wdMessages[0];

                    let olderWdMessages = await Promise.all(
                        (await sendRequest<Params, Response>(
                            methodName,
                            {
                                imsi,
                                "chatRef": wdChat.ref,
                                "olderThanTime": olderThanMessage.time,
                                maxMessageCount
                            }
                        )).map(encryptedOlderMessage =>
                            decryptMessage({
                                "decryptor": encryptorDecryptor,
                                "encryptedMessage": encryptedOlderMessage
                            })
                        )
                    );

                    const set = new Set(wdMessages.map(({ ref }) => ref));

                    for (let i = olderWdMessages.length - 1; i >= 0; i--) {

                        const message = olderWdMessages[i];

                        if (set.has(message.ref)) {
                            continue;
                        }

                        wdMessages.unshift(message);

                    }

                    wdMessages.sort(types.wd.Message.compare);

                    olderWdMessages = [];

                    for (const message of wdMessages) {

                        if (message.ref === olderThanMessage.ref) {
                            break;
                        }

                        olderWdMessages.push(message);

                    }

                    return olderWdMessages;

                }

            })(),
            /** 
             * 
             * Assert wdChat.message sorted by ordering time.
             * 
             * If same as before the request won't be sent .
             * 
             * Will update the data if the request was sent, meaning there is at least an incoming (or assimilated) 
             * message in the chat and the last message to be seen is not already the last message seen.
             * 
             * Will not update if wdChat.refOfLastMessageSeen have not been changed, this happens when:
             *  -There is no incoming (or assimilated) message in the chat. ( request not sent )
             *  -The more recent incoming (or assimilated) message in the chat is already 
             * the one pointed by wdChat.refOfLastMessageSeen. ( request not sent )
             * 
             * */
            "updateChatLastMessageSeen": (() => {

                const { methodName } = apiDeclaration.wd_updateChatLastMessageSeen;
                type Params = apiDeclaration.wd_updateChatLastMessageSeen.Params;
                type Response = apiDeclaration.wd_updateChatLastMessageSeen.Response;

                return async function (wdChat: types.wd.Chat): Promise<void> {

                    const messageRef: string | undefined = (() => {

                        for (let i = wdChat.messages.length - 1; i >= 0; i--) {

                            const message = wdChat.messages[i];

                            if (
                                message.direction === "INCOMING" ||
                                (
                                    message.status === "STATUS REPORT RECEIVED" &&
                                    message.sentBy.who === "OTHER"
                                )
                            ) {

                                return message.ref;

                            }

                        }

                        return undefined;

                    })();

                    if (
                        messageRef === undefined ||
                        messageRef === wdChat.refOfLastMessageSeen
                    ) {
                        return;
                    }

                    const params: Params = {
                        imsi,
                        "chatRef": wdChat.ref,
                        "refOfLastMessageSeen": messageRef
                    };

                    await sendRequest<Params, Response>(
                        methodName,
                        params
                    );

                    await onRequestProcessedByBackend({ methodName, params });

                }


            })(),
            /**
             * 
             * If same as before the request won't be sent 
             * 
             * */
            "updateChatContactInfos": (() => {

                const { methodName } = apiDeclaration.wd_updateChatContactInfos;
                type Params = apiDeclaration.wd_updateChatContactInfos.Params;
                type Response = apiDeclaration.wd_updateChatContactInfos.Response;

                return async function ({ wdChat, contactName, contactIndexInSim }: {
                    wdChat: types.wd.Chat;
                    contactName: string;
                    contactIndexInSim: number | null;
                }): Promise<void> {

                    const fields: Partial<Pick<types.wd.Chat, "contactName" | "contactIndexInSim">> = {
                        contactName,
                        contactIndexInSim
                    };

                    const params: Params = { imsi, "chatRef": wdChat.ref };

                    for (const key of Object.keys(fields) as (keyof typeof fields)[]) {

                        const value = fields[key];

                        if (value === undefined || wdChat[key] === value) {
                            continue;
                        }

                        switch (key) {
                            case "contactName":
                                params[key] = {
                                    "encrypted_string": await stringifyThenEncrypt(
                                        value as string
                                    )
                                };
                                break;
                            case "contactIndexInSim":
                                params[key] = {
                                    "encrypted_number_or_null": await stringifyThenEncrypt(
                                        value as number | null
                                    )
                                };
                                break;
                        }


                    }

                    if (Object.keys(params).length === 2) {
                        return;
                    }

                    await sendRequest<Params, Response>(
                        methodName,
                        params
                    );

                    await onRequestProcessedByBackend({ methodName, params });

                };



            })(),
            "destroyWdChat": (() => {

                const { methodName } = apiDeclaration.wd_destroyChat;
                type Params = apiDeclaration.wd_destroyChat.Params;
                type Response = apiDeclaration.wd_destroyChat.Response;

                return async function ({ wdChats, refOfTheChatToDelete }: {
                    wdChats: types.wd.Chat[];
                    refOfTheChatToDelete: string;
                }): Promise<void> {

                    const wdChat = wdChats.find(({ ref }) => ref == refOfTheChatToDelete);

                    if (!wdChat) {
                        return;
                    }

                    const params: Params = { imsi, "chatRef": refOfTheChatToDelete };

                    await sendRequest<Params, Response>(
                        methodName,
                        params
                    );

                    await onRequestProcessedByBackend({ methodName, params });

                };

            })(),
            /**
             * gwTypes.BundledData.ClientToServer.Message is assignable 
             * to arg0.bundledData * ( client to server )
             * */
            "newMessage": (() => {

                const { methodName } = apiDeclaration.wd_newMessage;
                type Params = apiDeclaration.wd_newMessage.Params;
                type Response = apiDeclaration.wd_newMessage.Response;

                type Args_Common = {
                    wdChat: types.wd.Chat,
                };

                type Args_IncomingMessage = Args_Common & {
                    type: "SERVER TO CLIENT";
                    bundledData:
                    gwTypes.BundledData.ServerToClient.Message |
                    gwTypes.BundledData.ServerToClient.MmsNotification |
                    gwTypes.BundledData.ServerToClient.CallAnsweredBy |
                    gwTypes.BundledData.ServerToClient.FromSipCallSummary |
                    gwTypes.BundledData.ServerToClient.MissedCall
                };

                type Args_OutgoingMessage = Args_Common & {
                    type: "CLIENT TO SERVER";
                    bundledData: {
                        exactSendDateTime: number;
                        text: string;
                    }
                };

                type Args = Args_IncomingMessage | Args_OutgoingMessage;

                async function out(args: Args_IncomingMessage): Promise<void>;
                async function out(args: Args_OutgoingMessage): Promise<{ onUaFailedToSendMessage: () => Promise<void>; }>;
                async function out(args: Args): Promise<any> {

                    const { wdChat } = args;

                    const [wdMessage, onUaFailedToSendMessage] = (() => {

                        switch (args.type) {
                            case "SERVER TO CLIENT": {

                                const { bundledData } = args;

                                const direction = "INCOMING";

                                return [
                                    bundledData.type === "MESSAGE" ?
                                        (() => {

                                            const time = bundledData.pduDateTime;

                                            return id<types.wd.Message.Incoming.Text>({
                                                "ref": buildWdMessageRef(time, direction),
                                                time,
                                                direction,
                                                "text": bundledData.text,
                                                "isNotification": false
                                            });

                                        })()
                                        :
                                        (() => {

                                            const time = (() => {

                                                switch (bundledData.type) {
                                                    case "CALL ANSWERED BY":
                                                    case "MISSED CALL":
                                                        return bundledData.dateTime;
                                                    case "MMS NOTIFICATION":
                                                        return bundledData.pduDateTime;
                                                    case "FROM SIP CALL SUMMARY":
                                                        return bundledData.callPlacedAtDateTime;
                                                }

                                            })();

                                            return id<types.wd.Message.Incoming.Notification>({
                                                "ref": buildWdMessageRef(time, direction),
                                                time,
                                                direction,
                                                "text": bundledData.text,
                                                "isNotification": true,
                                            });


                                        })(),
                                    undefined
                                ] as const;

                            };
                            case "CLIENT TO SERVER": {

                                const { bundledData } = args;

                                const time = bundledData.exactSendDateTime;

                                const direction = "OUTGOING";

                                const wdMessage: types.wd.Message.Outgoing.Pending = {
                                    "ref": buildWdMessageRef(time, direction),
                                    time,
                                    direction,
                                    "status": "PENDING",
                                    "text": bundledData.text
                                };

                                return [
                                    wdMessage,
                                    //NOTE: Hack
                                    () => wdApi.notifySendReportReceived({
                                        wdChat,
                                        "bundledData": {
                                            "sendDateTime": null,
                                            "messageTowardGsm": {
                                                "dateTime": wdMessage.time,
                                                "text": wdMessage.text
                                            }
                                        }
                                    })
                                ] as const;

                            };
                        }

                    })();

                    if (!!wdChat.messages.find(({ ref }) => ref === wdMessage.ref)) {
                        return;
                    }

                    const params: Params = {
                        imsi,
                        "chatRef": wdChat.ref,
                        "message": {
                            ...wdMessage,
                            "text": { "encrypted_string": await stringifyThenEncrypt(wdMessage.text) }
                        }
                    };

                    await sendRequest<Params, Response>(
                        methodName,
                        params
                    );

                    await onRequestProcessedByBackend({ methodName, params });

                    if (!onUaFailedToSendMessage) {
                        return;
                    }

                    return { onUaFailedToSendMessage };

                };

                return out;

            })(),
            /**gwTypes.BundledData.ServerToClient.SendReport is assignable to bundledData*/
            "notifySendReportReceived": (() => {

                const { methodName } = apiDeclaration.wd_notifySendReportReceived;
                type Params = apiDeclaration.wd_notifySendReportReceived.Params;
                type Response = apiDeclaration.wd_notifySendReportReceived.Response;

                return async function callee(
                    { wdChat, bundledData }: {
                        wdChat: types.wd.Chat,
                        bundledData: {
                            messageTowardGsm: {
                                dateTime: number;
                                text: string;
                            };
                            sendDateTime: number | null;
                        }
                    }
                ) {

                    const time = bundledData.messageTowardGsm.dateTime;
                    const direction = "OUTGOING" as const;

                    const wdMessageRef = buildWdMessageRef(time, direction);

                    const wdMessage = wdChat.messages
                        .find(({ ref }) => ref === wdMessageRef) as types.wd.Message.Outgoing | undefined;

                    if (wdMessage !== undefined && wdMessage.status !== "PENDING") {
                        return;
                    }

                    if (wdMessage === undefined) {

                        await wdApi.newMessage({
                            wdChat,
                            "type": "CLIENT TO SERVER",
                            "bundledData": {
                                "exactSendDateTime": time,
                                "text": bundledData.messageTowardGsm.text
                            }
                        });

                        await callee({ wdChat, bundledData });

                        return;

                    }

                    const params: Params = {
                        imsi,
                        "chatRef": wdChat.ref,
                        "messageRef": wdMessageRef,
                        "isSentSuccessfully": bundledData.sendDateTime !== null
                    };

                    await sendRequest<Params, Response>(
                        methodName,
                        params
                    );

                    await onRequestProcessedByBackend({ methodName, params });

                };


            })(),
            "notifyStatusReportReceived": (() => {

                const { methodName } = apiDeclaration.wd_notifyStatusReportReceived;
                type Params = apiDeclaration.wd_notifyStatusReportReceived.Params;
                type Response = apiDeclaration.wd_notifyStatusReportReceived.Response;

                return async function callee(
                    { wdChat, bundledData }: {
                        wdChat: types.wd.Chat,
                        bundledData: gwTypes.BundledData.ServerToClient.StatusReport
                    }
                ):Promise<void> {


                    const time = bundledData.messageTowardGsm.dateTime;
                    const direction = "OUTGOING" as const;

                    const wdMessageRef = buildWdMessageRef(time, direction);

                    const wdMessage = wdChat.messages
                        .find(({ ref }) => ref === wdMessageRef) as types.wd.Message.Outgoing | undefined;

                    if (wdMessage !== undefined && wdMessage.status === "STATUS REPORT RECEIVED") {
                        return;
                    }

                    if (wdMessage === undefined || wdMessage.status === "PENDING") {

                        await wdApi.notifySendReportReceived({
                            wdChat,
                            "bundledData": {
                                "sendDateTime": bundledData.statusReport.sendDateTime,
                                "messageTowardGsm": bundledData.messageTowardGsm
                            }
                        });

                        await callee({ wdChat, bundledData });

                        return;

                    }

                    const deliveredTime = bundledData.statusReport.isDelivered ?
                        bundledData.statusReport.dischargeDateTime : null
                        ;

                    const sentBy: types.wd.Message.Outgoing.StatusReportReceived["sentBy"] =
                        bundledData.messageTowardGsm.uaSim.ua.userEmail === userEmail! ?
                            ({ "who": "USER" }) :
                            ({ "who": "OTHER", "email": bundledData.messageTowardGsm.uaSim.ua.userEmail });


                    const params: Params = {
                        imsi,
                        "chatRef": wdChat.ref,
                        "messageRef": wdMessageRef,
                        deliveredTime,
                        "sentBy": sentBy.who === "USER" ? sentBy : ({
                            "who": "OTHER",
                            "email": { "encrypted_string": await stringifyThenEncrypt(sentBy.email) }
                        })
                    };

                    await sendRequest<Params, Response>(
                        methodName,
                        params
                    );

                    await onRequestProcessedByBackend({ methodName, params });



                };

            })(),
            /** Hack so we don't have to handle special case when UA can't send message */
            "notifyUaFailedToSendMessage": async (
                wdChat: types.wd.Chat,
                wdMessage: types.wd.Message.Outgoing.Pending
            ): Promise<void> => {

                await wdApi.notifySendReportReceived({
                    wdChat,
                    "bundledData": {
                        "sendDateTime": null,
                        "messageTowardGsm": {
                            "dateTime": wdMessage.time,
                            "text": wdMessage.text
                        }
                    }
                });

            }
        };

        return wdApi;

    };

}


export type WdApi = ReturnType<ReturnType<typeof getWdApiFactory>>;

function getGetGetWdEvts(
    params: {
        encryptorDecryptor: cryptoLib.EncryptorDecryptor,
        evtRequestProcessedByBackend: { attach: RemoteNotifyEvts["evtWdActionFromOtherUa"]["attach"] }
        decryptMessage: ReturnType<typeof types.wd.Message.decryptFactory>;
    }
) {

    const { encryptorDecryptor, evtRequestProcessedByBackend, decryptMessage } = params;

    const decryptThenParse = cryptoLib.decryptThenParseFactory(encryptorDecryptor);

    return function getGetWdEvts(imsi: string) {

        return function getWdEvts(wdChats: types.wd.Chat[]): types.wd.Evts {

            const out: ToPostableEvt<types.wd.Evts> = {
                "evtWdChat": new Evt(),
                "evtWdMessage": new Evt()
            };



            evtRequestProcessedByBackend.attach(
                ({ params: { imsi: imsi_ } }) => imsi_ === imsi,
                async evtData => (async () => {

                    switch (evtData.methodName) {
                        case "wd_newChat": {

                            const { params } = evtData;

                            const { chatRef } = params;

                            if (!!wdChats.find(({ ref }) => ref === chatRef)) {
                                return;
                            }

                            const [
                                contactNumber,
                                contactName,
                                contactIndexInSim
                            ] = await Promise.all(
                                [
                                    decryptThenParse<string>(params.contactNumber.encrypted_string),
                                    decryptThenParse<string>(params.contactName.encrypted_string),
                                    decryptThenParse<number | null>(params.contactIndexInSim.encrypted_number_or_null)
                                ] as const
                            );

                            const wdChat: types.wd.Chat = {
                                "ref": chatRef,
                                contactNumber,
                                contactName,
                                contactIndexInSim,
                                "refOfLastMessageSeen": null,
                                "messages": []
                            };

                            wdChats.push(wdChat);

                            wdChats.sort(types.wd.Chat.compare);

                            out.evtWdChat.post({ wdChat, "eventType": "NEW" });

                        } break;
                        case "wd_updateChatLastMessageSeen": {

                            const { params } = evtData;

                            const wdChat = wdChats.find(({ ref }) => ref === params.chatRef);

                            if (!wdChat) {
                                return;
                            }

                            wdChat.refOfLastMessageSeen = params.refOfLastMessageSeen;

                            out.evtWdChat.post({
                                wdChat,
                                "eventType": "UPDATED",
                                "changes": {
                                    "unreadMessageCount": true,
                                    "contactInfos": false,
                                    "ordering": false
                                }
                            });

                        } break;
                        case "wd_updateChatContactInfos": {

                            const { params } = evtData;

                            const indexBefore = wdChats
                                .findIndex(({ ref }) => ref === params.chatRef)
                                ;

                            if (indexBefore < 0) {
                                return;
                            }

                            const wdChat = wdChats[indexBefore];

                            const [contactName, contactIndexInSim] = await Promise.all([
                                params.contactName !== undefined ?
                                    decryptThenParse<string>(params.contactName.encrypted_string) : undefined,
                                params.contactIndexInSim !== undefined ?
                                    decryptThenParse<number | null>(params.contactIndexInSim.encrypted_number_or_null) : undefined
                            ] as const);

                            if (contactName !== undefined) {
                                wdChat.contactName = contactName;
                            }

                            if (contactIndexInSim !== undefined) {
                                wdChat.contactIndexInSim = contactIndexInSim;
                            }

                            wdChats.sort(types.wd.Chat.compare);

                            out.evtWdChat.post({
                                wdChat,
                                "eventType": "UPDATED",
                                "changes": {
                                    "ordering": wdChats.indexOf(wdChat) !== indexBefore,
                                    "contactInfos": true,
                                    "unreadMessageCount": false
                                }
                            });

                        } break;
                        case "wd_destroyChat": {

                            const { params } = evtData;

                            const wdChat = wdChats.find(({ ref }) => ref === params.chatRef);

                            if (!wdChat) {
                                return;
                            }

                            wdChats.splice(
                                wdChats.indexOf(wdChat),
                                1
                            );

                            out.evtWdChat.post({ wdChat, "eventType": "DELETED" });


                        } break;
                        case "wd_newMessage": {

                            const { params } = evtData;

                            const indexBefore = wdChats.findIndex(({ ref }) => ref === params.chatRef);

                            if (indexBefore < 0) {
                                return;
                            }

                            const wdChat = wdChats[indexBefore];

                            const wdMessage = await decryptMessage({
                                "decryptor": encryptorDecryptor,
                                "encryptedMessage": params.message
                            });

                            if (!!wdChat.messages.find(({ ref }) => ref === wdMessage.ref)) {
                                return;
                            }

                            wdChat.messages.push(wdMessage);

                            wdChat.messages.sort(types.wd.Message.compare);

                            wdChats.sort(types.wd.Chat.compare);

                            out.evtWdChat.post({
                                wdChat,
                                "eventType": "UPDATED",
                                "changes": {
                                    "ordering": wdChats.indexOf(wdChat) !== indexBefore,
                                    "unreadMessageCount": wdMessage.direction === "INCOMING",
                                    "contactInfos": false
                                }
                            });

                            out.evtWdMessage.post({
                                wdChat,
                                wdMessage,
                                "eventType": "NEW"
                            });

                        } break;
                        case "wd_notifySendReportReceived": {

                            const { params } = evtData;

                            const wdChatIndexBefore = wdChats.findIndex(({ ref }) => ref === params.chatRef);

                            if (wdChatIndexBefore < 0) {
                                return;
                            }

                            const wdChat = wdChats[wdChatIndexBefore];

                            const wdMessage = wdChat.messages
                                .find((wdMessage): wdMessage is types.wd.Message.Outgoing.Pending => (
                                    wdMessage.ref === params.messageRef &&
                                    wdMessage.direction === "OUTGOING" &&
                                    wdMessage.status === "PENDING"
                                ));

                            if (wdMessage === undefined) {
                                return;
                            }

                            createObjectWithGivenRef<types.wd.Message.Outgoing.SendReportReceived>(
                                wdMessage,
                                {
                                    "ref": params.messageRef,
                                    "time": wdMessage.time,
                                    "direction": "OUTGOING",
                                    "text": wdMessage.text,
                                    "status": "SEND REPORT RECEIVED",
                                    "isSentSuccessfully": params.isSentSuccessfully
                                }
                            );

                            const wdMessageIndexBefore = wdChat.messages.indexOf(wdMessage);

                            wdChat.messages.sort(types.wd.Message.compare);

                            wdChats.sort(types.wd.Chat.compare);

                            out.evtWdChat.post({
                                wdChat,
                                "eventType": "UPDATED",
                                "changes": {
                                    "ordering": wdChats.indexOf(wdChat) !== wdChatIndexBefore,
                                    "unreadMessageCount": false,
                                    "contactInfos": false
                                }
                            });

                            out.evtWdMessage.post({
                                wdChat,
                                wdMessage,
                                "eventType": "UPDATED",
                                "orderingChange": wdChat.messages.indexOf(wdMessage) !== wdMessageIndexBefore
                            });


                        } break;
                        case "wd_notifyStatusReportReceived": {

                            const { params } = evtData;


                            const wdChatIndexBefore = wdChats.findIndex(({ ref }) => ref === params.chatRef);

                            if (wdChatIndexBefore < 0) {
                                return;
                            }

                            const wdChat = wdChats[wdChatIndexBefore];

                            const wdMessage_beforeUpdate = wdChat.messages
                                .find((wdMessage): wdMessage is types.wd.Message.Outgoing.SendReportReceived => (
                                    wdMessage.ref === params.messageRef &&
                                    wdMessage.direction === "OUTGOING" &&
                                    wdMessage.status === "SEND REPORT RECEIVED"
                                ));

                            if (wdMessage_beforeUpdate === undefined) {
                                return;
                            }

                            const wdMessage = createObjectWithGivenRef<types.wd.Message.Outgoing.StatusReportReceived>(
                                wdMessage_beforeUpdate,
                                await (async () => {

                                    const part = {
                                        "ref": params.messageRef,
                                        "time": wdMessage_beforeUpdate.time,
                                        "direction": "OUTGOING" as const,
                                        "text": wdMessage_beforeUpdate.text,
                                        "status": "STATUS REPORT RECEIVED" as const,
                                        "deliveredTime": params.deliveredTime
                                    };

                                    const { sentBy } = params;

                                    return sentBy.who === "USER" ?
                                        id<types.wd.Message.Outgoing.StatusReportReceived.SentByUser>({
                                            ...part,
                                            sentBy
                                        })
                                        :
                                        id<types.wd.Message.Outgoing.StatusReportReceived.SentByOther>({
                                            ...part,
                                            "sentBy": {
                                                "who": "OTHER",
                                                "email": await decryptThenParse<string>(sentBy.email.encrypted_string)
                                            }
                                        })
                                        ;


                                })()
                            );

                            const wdMessageIndexBefore = wdChat.messages.indexOf(wdMessage);

                            wdChat.messages.sort(types.wd.Message.compare);

                            wdChats.sort(types.wd.Chat.compare);

                            out.evtWdChat.post({
                                wdChat,
                                "eventType": "UPDATED",
                                "changes": {
                                    "ordering": wdChats.indexOf(wdChat) !== wdChatIndexBefore,
                                    "unreadMessageCount": wdMessage.sentBy.who === "OTHER",
                                    "contactInfos": false
                                }
                            });

                            out.evtWdMessage.post({
                                wdChat,
                                wdMessage,
                                "eventType": "UPDATED",
                                "orderingChange": wdChat.messages.indexOf(wdMessage) !== wdMessageIndexBefore
                            });



                        } break;
                    }

                })()
                    .then(() => evtData.handlerCb?.())
                    .catch(error => evtData.handlerCb?.(error))
            );

            return out;

        };
    };
}

