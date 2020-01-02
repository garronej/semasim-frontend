
import * as apiDeclaration from "../../../sip_api_declarations/backendToUa";
import { types as gwTypes } from "../../../gateway/types";
import { phoneNumber } from "phone-number/dist/lib";
import * as wd from "../../types/webphoneData/logic"
import * as md5 from "md5";
import * as cryptoLib from "../../crypto/cryptoLibProxy";
import { SyncEvent } from "ts-events-extended";
import { createObjectWithGivenRef } from "../../../tools/createObjectWithGivenRef";
import { id } from "../../../tools/id";
import { assert } from "../../../tools/assert";

export type WdEvts = {
    evtNewUpdatedOrDeletedWdChat: SyncEvent<{ wdChat: wd.Chat<"PLAIN">; eventType: "NEW" | "UPDATED" | "DELETED" }>,
    evtNewOrUpdatedWdMessage: SyncEvent<{ wdChat: wd.Chat<"PLAIN">; wdMessage: wd.Message<"PLAIN">; }>
};


type RequestProcessedByBackend = SyncEvent.Type<import("../appEvts").AppEvts["evtWdActionFromOtherUa"]>;

export type AppEvts = {
    evtWdActionFromOtherUa: SyncEvent<
        RequestProcessedByBackend &
        { handlerCb?: (error?: Error) => void }
    >;
};


const hash: (str: string) => string = md5;

//NOTE: time and direction are plain in db, ref does not need to be secure.
const buildWdMessageRef = (
    time: number,
    direction: "INCOMING" | "OUTGOING"
): string => hash(`${time}${direction}`);


/** Inject send request only when testing */
export function getApiCallerForSpecificSimFactory(
    sendRequest: typeof import("./sendRequest").sendRequest,
    appEvts: AppEvts,
    encryptorDecryptor: cryptoLib.EncryptorDecryptor,
    userEmail: string
) {

    const stringifyThenEncrypt = cryptoLib.stringifyThenEncryptFactory(encryptorDecryptor);

    const evtRequestProcessedByBackend: AppEvts["evtWdActionFromOtherUa"] = new SyncEvent();

    const onRequestProcessedByBackend = async (arg: RequestProcessedByBackend) => 
        new Promise<void>((resolve, reject) => {

            let count= 0;

            const evtData: SyncEvent.Type<typeof evtRequestProcessedByBackend> = { 
                ...arg, 
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

            const handlerCount = evtRequestProcessedByBackend.getHandlers().filter(({ matcher }) => matcher(evtData)).length;

            assert( handlerCount !== 0 );

            evtRequestProcessedByBackend.post(evtData);

        });

    appEvts.evtWdActionFromOtherUa.attach(
        evtData => evtRequestProcessedByBackend.post(evtData)
    );

    const getGetWdEvts = getGetGetWdEvts(encryptorDecryptor, evtRequestProcessedByBackend);

    return function getApiCallerForSpecificSim(imsi: string) {

        const getWdEvts = getGetWdEvts(imsi);

        const apiCallerForSpecificSim = {
            "getUserSimChats": (() => {

                const { methodName } = apiDeclaration.wd_getUserSimChats;
                type Params = apiDeclaration.wd_getUserSimChats.Params;
                type Response = apiDeclaration.wd_getUserSimChats.Response;

                return async function (maxMessageCountByChat: number): Promise<{
                    wdChats: wd.Chat<"PLAIN">[];
                    wdEvts: WdEvts
                }> {

                    const wdEncryptedChats = await sendRequest<Params, Response>(
                        methodName,
                        { imsi, maxMessageCountByChat }
                    );

                    const wdChats = await Promise.all(
                        wdEncryptedChats.map(
                            chat => wd.decryptChat(
                                encryptorDecryptor,
                                chat
                            )
                        )
                    );

                    for (const wdChat of wdChats) {

                        wdChat.messages.sort(wd.compareMessage);

                    }

                    const wdEvts = getWdEvts(wdChats);

                    return { wdChats, wdEvts };

                };

            })(),
            /** If there is already a chat with the contact number nothing will be done */
            "newChat": (() => {

                const { methodName } = apiDeclaration.wd_newChat;
                type Params = apiDeclaration.wd_newChat.Params;
                type Response = apiDeclaration.wd_newChat.Response;

                return async function (
                    wdChats: wd.Chat<"PLAIN">[],
                    contactNumber: phoneNumber,
                    contactName: string,
                    contactIndexInSim: number | null
                ): Promise<void> {

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

                return async function (
                    wdChat: wd.Chat<"PLAIN">,
                    maxMessageCount: number
                ): Promise<wd.Message<"PLAIN">[]> {

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
                            wd.decryptMessage(
                                encryptorDecryptor,
                                encryptedOlderMessage
                            )
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

                    wdMessages.sort(wd.compareMessage);

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

                return async function (wdChat: wd.Chat<"PLAIN">): Promise<void> {

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
             * return true if request was sent
             * 
             * */
            "updateChatContactInfos": (() => {

                const { methodName } = apiDeclaration.wd_updateChatContactInfos;
                type Params = apiDeclaration.wd_updateChatContactInfos.Params;
                type Response = apiDeclaration.wd_updateChatContactInfos.Response;

                return async function (
                    wdChat: wd.Chat<"PLAIN">,
                    contactName: string,
                    contactIndexInSim: number | null
                ): Promise<void> {

                    const fields: Partial<Pick<wd.Chat<"PLAIN">, "contactName" | "contactIndexInSim">> = {
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

                return async function (
                    wdChats: wd.Chat<"PLAIN">[],
                    refOfTheChatToDelete: string
                ): Promise<void> {

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


                type Arg1_IncomingMessage = {
                    type: "SERVER TO CLIENT";
                    bundledData:
                    gwTypes.BundledData.ServerToClient.Message |
                    gwTypes.BundledData.ServerToClient.MmsNotification |
                    gwTypes.BundledData.ServerToClient.CallAnsweredBy |
                    gwTypes.BundledData.ServerToClient.FromSipCallSummary |
                    gwTypes.BundledData.ServerToClient.MissedCall
                };

                type Arg1_OutgoingMessage = {
                    type: "CLIENT TO SERVER";
                    bundledData: {
                        exactSendDateTime: number;
                        text: string;
                    }
                };

                type Arg1 = Arg1_IncomingMessage | Arg1_OutgoingMessage;

                async function out(
                    wdChat: wd.Chat<"PLAIN">,
                    arg1: Arg1_IncomingMessage
                ): Promise<void>;
                async function out(
                    wdChat: wd.Chat<"PLAIN">,
                    arg1: Arg1_OutgoingMessage
                ): Promise<{ onUaFailedToSendMessage: () => Promise<void>; }>;
                async function out(
                    wdChat: wd.Chat<"PLAIN">,
                    arg1: Arg1
                ): Promise<any> {

                    const [wdMessage, onUaFailedToSendMessage] = (() => {

                        switch (arg1.type) {
                            case "SERVER TO CLIENT": {

                                const { bundledData } = arg1;

                                const direction = "INCOMING";

                                let out: wd.Message.Incoming.Text<"PLAIN"> | wd.Message.Incoming.Notification<"PLAIN">;

                                if (bundledData.type === "MESSAGE") {

                                    const time = bundledData.pduDateTime;

                                    const out_: wd.Message.Incoming.Text<"PLAIN"> = {
                                        "ref": buildWdMessageRef(time, direction),
                                        time,
                                        direction,
                                        "text": bundledData.text,
                                        "isNotification": false
                                    };

                                    out = out_;


                                } else {

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

                                    const out_: wd.Message.Incoming.Notification<"PLAIN"> = {
                                        "ref": buildWdMessageRef(time, direction),
                                        time,
                                        direction,
                                        "text": bundledData.text,
                                        "isNotification": true,
                                    };

                                    out = out_;


                                }

                                return [out, undefined] as const;

                            };
                            case "CLIENT TO SERVER": {

                                const { bundledData } = arg1;

                                const time = bundledData.exactSendDateTime;

                                const direction = "OUTGOING";

                                const out: wd.Message.Outgoing.Pending<"PLAIN"> = {
                                    "ref": buildWdMessageRef(time, direction),
                                    time,
                                    direction,
                                    "status": "PENDING",
                                    "text": bundledData.text
                                };

                                return [
                                    out,
                                    //NOTE: Hack
                                    () => apiCallerForSpecificSim.notifySendReportReceived(
                                        wdChat,
                                        {
                                            "sendDateTime": null,
                                            "messageTowardGsm": {
                                                "dateTime": out.time,
                                                "text": out.text
                                            }
                                        }
                                    )
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
                    wdChat: wd.Chat<"PLAIN">,
                    bundledData: {
                        messageTowardGsm: {
                            dateTime: number;
                            text: string;
                        };
                        sendDateTime: number | null;
                    }
                ) {

                    const time = bundledData.messageTowardGsm.dateTime;
                    const direction = "OUTGOING" as const;

                    const wdMessageRef = buildWdMessageRef(time, direction);

                    const wdMessage = wdChat.messages
                        .find(({ ref }) => ref === wdMessageRef) as wd.Message.Outgoing<"PLAIN"> | undefined;

                    if (wdMessage !== undefined && wdMessage.status !== "PENDING") {
                        return;
                    }

                    if (wdMessage === undefined) {

                        await apiCallerForSpecificSim.newMessage(
                            wdChat,
                            {
                                "type": "CLIENT TO SERVER",
                                "bundledData": {
                                    "exactSendDateTime": time,
                                    "text": bundledData.messageTowardGsm.text
                                }
                            }
                        );

                        await callee(wdChat, bundledData);

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
                    wdChat: wd.Chat<"PLAIN">,
                    bundledData: gwTypes.BundledData.ServerToClient.StatusReport
                ) {


                    const time = bundledData.messageTowardGsm.dateTime;
                    const direction = "OUTGOING" as const;

                    const wdMessageRef = buildWdMessageRef(time, direction);

                    const wdMessage = wdChat.messages
                        .find(({ ref }) => ref === wdMessageRef) as wd.Message.Outgoing<"PLAIN"> | undefined;

                    if (wdMessage !== undefined && wdMessage.status === "STATUS REPORT RECEIVED") {
                        return;
                    }

                    if (wdMessage === undefined || wdMessage.status === "PENDING") {

                        await apiCallerForSpecificSim.notifySendReportReceived(
                            wdChat,
                            {
                                "sendDateTime": bundledData.statusReport.sendDateTime,
                                "messageTowardGsm": bundledData.messageTowardGsm
                            }
                        );

                        await callee(wdChat, bundledData);

                        return;

                    }

                    const deliveredTime = bundledData.statusReport.isDelivered ?
                        bundledData.statusReport.dischargeDateTime : null
                        ;

                    const sentBy: wd.Message.Outgoing.StatusReportReceived<"PLAIN">["sentBy"] =
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
                wdChat: wd.Chat<"PLAIN">,
                wdMessage: wd.Message.Outgoing.Pending<"PLAIN">
            ): Promise<void> => {

                await apiCallerForSpecificSim.notifySendReportReceived(
                    wdChat,
                    {
                        "sendDateTime": null,
                        "messageTowardGsm": {
                            "dateTime": wdMessage.time,
                            "text": wdMessage.text
                        }
                    }
                );

            }
        };

        return apiCallerForSpecificSim;

    };

}

function getGetGetWdEvts(
    encryptorDecryptor: cryptoLib.EncryptorDecryptor,
    //evtRequestProcessedByBackend: { attach: EvtRequestProcessedByBackend["attach"] },
    evtRequestProcessedByBackend: { attach: AppEvts["evtWdActionFromOtherUa"]["attach"] }
) {

    const decryptThenParse = cryptoLib.decryptThenParseFactory(encryptorDecryptor);

    return function getGetWdEvts(imsi: string) {

        return function getWdEvts(wdChats: wd.Chat<"PLAIN">[]): WdEvts {

            const out: WdEvts = {
                "evtNewUpdatedOrDeletedWdChat": new SyncEvent(),
                "evtNewOrUpdatedWdMessage": new SyncEvent()
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

                            const wdChat: wd.Chat<"PLAIN"> = {
                                "ref": chatRef,
                                contactNumber,
                                contactName,
                                contactIndexInSim,
                                "refOfLastMessageSeen": null,
                                "messages": []
                            };

                            wdChats.push(wdChat);

                            out.evtNewUpdatedOrDeletedWdChat.post({ wdChat, "eventType": "NEW" });

                        } break;
                        case "wd_updateChatLastMessageSeen": {

                            const { params } = evtData;

                            const wdChat = wdChats.find(({ ref }) => ref === params.chatRef);

                            if (!wdChat) {
                                return;
                            }

                            wdChat.refOfLastMessageSeen = params.refOfLastMessageSeen;

                            out.evtNewUpdatedOrDeletedWdChat.post({ wdChat, "eventType": "UPDATED" });

                        } break;
                        case "wd_updateChatContactInfos": {

                            const { params } = evtData;

                            const wdChat = wdChats.find(({ ref }) => ref === params.chatRef);

                            if (!wdChat) {
                                return;
                            }

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

                            out.evtNewUpdatedOrDeletedWdChat.post({ wdChat, "eventType": "UPDATED" });

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

                            out.evtNewUpdatedOrDeletedWdChat.post({ wdChat, "eventType": "DELETED" });


                        } break;
                        case "wd_newMessage": {

                            const { params } = evtData;

                            const wdChat = wdChats.find(({ ref }) => ref === params.chatRef);

                            if (!wdChat) {
                                return;
                            }

                            const wdMessage = await wd.decryptMessage(encryptorDecryptor, params.message);

                            if (!!wdChat.messages.find(({ ref }) => ref === wdMessage.ref)) {
                                return;
                            }

                            wdChat.messages.push(wdMessage);

                            wdChat.messages.sort(wd.compareMessage);

                            if (wdMessage.direction === "INCOMING") {
                                //NOTE: Metadata unreadMessageCount will have changed
                                out.evtNewUpdatedOrDeletedWdChat.post({ wdChat, "eventType": "UPDATED" });
                            }

                            out.evtNewOrUpdatedWdMessage.post({ wdChat, wdMessage });

                        } break;
                        case "wd_notifySendReportReceived": {

                            const { params } = evtData;

                            const wdChat = wdChats.find(({ ref }) => ref === params.chatRef);

                            if (!wdChat) {
                                return;
                            }

                            const wdMessage = wdChat.messages
                                .find((wdMessage): wdMessage is wd.Message.Outgoing.Pending<"PLAIN"> => (
                                    wdMessage.ref === params.messageRef &&
                                    wdMessage.direction === "OUTGOING" &&
                                    wdMessage.status === "PENDING"
                                ));

                            if (wdMessage === undefined) {
                                return;
                            }

                            createObjectWithGivenRef<wd.Message.Outgoing.SendReportReceived<"PLAIN">>(
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

                            wdChat.messages.sort(wd.compareMessage);

                            out.evtNewOrUpdatedWdMessage.post({ wdChat, wdMessage });

                        } break;
                        case "wd_notifyStatusReportReceived": {

                            const { params } = evtData;

                            const wdChat = wdChats.find(({ ref }) => ref === params.chatRef);

                            if (!wdChat) {
                                return;
                            }

                            const wdMessage_beforeUpdate = wdChat.messages
                                .find((wdMessage): wdMessage is wd.Message.Outgoing.SendReportReceived<"PLAIN"> => (
                                    wdMessage.ref === params.messageRef &&
                                    wdMessage.direction === "OUTGOING" &&
                                    wdMessage.status === "SEND REPORT RECEIVED"
                                ));

                            if (wdMessage_beforeUpdate === undefined) {
                                return;
                            }

                            const wdMessage = createObjectWithGivenRef<wd.Message.Outgoing.StatusReportReceived<"PLAIN">>(
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
                                        id<wd.Message.Outgoing.StatusReportReceived.SentByUser<"PLAIN">>({
                                            ...part,
                                            sentBy
                                        })
                                        :
                                        id<wd.Message.Outgoing.StatusReportReceived.SentByOther<"PLAIN">>({
                                            ...part,
                                            "sentBy": {
                                                "who": "OTHER",
                                                "email": await decryptThenParse<string>(sentBy.email.encrypted_string)
                                            }
                                        })
                                        ;


                                })()
                            );

                            wdChat.messages.sort(wd.compareMessage);

                            if (wdMessage.sentBy.who === "OTHER") {
                                //NOTE: unreadMessageCount will have changed.
                                out.evtNewUpdatedOrDeletedWdChat.post({ wdChat, "eventType": "UPDATED" });
                            }

                            out.evtNewOrUpdatedWdMessage.post({ wdChat, wdMessage });

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

