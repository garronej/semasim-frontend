"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var getUsableUserSims;
(function (getUsableUserSims) {
    getUsableUserSims.methodName = "getUsableUserSims";
})(getUsableUserSims = exports.getUsableUserSims || (exports.getUsableUserSims = {}));
var unlockSim;
(function (unlockSim) {
    unlockSim.methodName = "unlockSim";
})(unlockSim = exports.unlockSim || (exports.unlockSim = {}));
var registerSim;
(function (registerSim) {
    registerSim.methodName = "registerSim";
})(registerSim = exports.registerSim || (exports.registerSim = {}));
var unregisterSim;
(function (unregisterSim) {
    unregisterSim.methodName = "unregisterSim";
})(unregisterSim = exports.unregisterSim || (exports.unregisterSim = {}));
var rebootDongle;
(function (rebootDongle) {
    rebootDongle.methodName = "rebootDongle";
})(rebootDongle = exports.rebootDongle || (exports.rebootDongle = {}));
var shareSim;
(function (shareSim) {
    shareSim.methodName = "shareSim";
})(shareSim = exports.shareSim || (exports.shareSim = {}));
var stopSharingSim;
(function (stopSharingSim) {
    stopSharingSim.methodName = "stopSharingSim";
})(stopSharingSim = exports.stopSharingSim || (exports.stopSharingSim = {}));
var changeSimFriendlyName;
(function (changeSimFriendlyName) {
    changeSimFriendlyName.methodName = "changeSimFriendlyName";
})(changeSimFriendlyName = exports.changeSimFriendlyName || (exports.changeSimFriendlyName = {}));
//NOTE: The DB transaction to use is setSimFriendlyName
var acceptSharingRequest;
(function (acceptSharingRequest) {
    acceptSharingRequest.methodName = "acceptSharingRequest";
})(acceptSharingRequest = exports.acceptSharingRequest || (exports.acceptSharingRequest = {}));
//NOTE: The DB transaction to use is unregisterSim
var rejectSharingRequest;
(function (rejectSharingRequest) {
    rejectSharingRequest.methodName = "rejectSharingRequest";
})(rejectSharingRequest = exports.rejectSharingRequest || (exports.rejectSharingRequest = {}));
var createContact;
(function (createContact) {
    createContact.methodName = "createContact";
})(createContact = exports.createContact || (exports.createContact = {}));
var updateContactName;
(function (updateContactName) {
    updateContactName.methodName = "updateContactName";
})(updateContactName = exports.updateContactName || (exports.updateContactName = {}));
var deleteContact;
(function (deleteContact) {
    deleteContact.methodName = "deleteContact";
})(deleteContact = exports.deleteContact || (exports.deleteContact = {}));
var shouldAppendPromotionalMessage;
(function (shouldAppendPromotionalMessage) {
    shouldAppendPromotionalMessage.methodName = "shouldAppendSenTWithSemasim";
})(shouldAppendPromotionalMessage = exports.shouldAppendPromotionalMessage || (exports.shouldAppendPromotionalMessage = {}));
//WebphoneData Sync things:
var wd_getUserSimChats;
(function (wd_getUserSimChats) {
    wd_getUserSimChats.methodName = "wd_getUserSimChats";
})(wd_getUserSimChats = exports.wd_getUserSimChats || (exports.wd_getUserSimChats = {}));
var wd_newChat;
(function (wd_newChat) {
    wd_newChat.methodName = "wd_newChat";
})(wd_newChat = exports.wd_newChat || (exports.wd_newChat = {}));
var wd_fetchOlderMessages;
(function (wd_fetchOlderMessages) {
    wd_fetchOlderMessages.methodName = "wd_fetchOlderMessages";
})(wd_fetchOlderMessages = exports.wd_fetchOlderMessages || (exports.wd_fetchOlderMessages = {}));
var wd_updateChatLastMessageSeen;
(function (wd_updateChatLastMessageSeen) {
    wd_updateChatLastMessageSeen.methodName = "wd_updateChatLastMessageSeen";
})(wd_updateChatLastMessageSeen = exports.wd_updateChatLastMessageSeen || (exports.wd_updateChatLastMessageSeen = {}));
var wd_updateChatContactInfos;
(function (wd_updateChatContactInfos) {
    wd_updateChatContactInfos.methodName = "wd_updateChatContactInfos";
})(wd_updateChatContactInfos = exports.wd_updateChatContactInfos || (exports.wd_updateChatContactInfos = {}));
var wd_destroyChat;
(function (wd_destroyChat) {
    wd_destroyChat.methodName = "wd_destroyChat";
})(wd_destroyChat = exports.wd_destroyChat || (exports.wd_destroyChat = {}));
var wd_newMessage;
(function (wd_newMessage) {
    wd_newMessage.methodName = "wd_newMessage";
})(wd_newMessage = exports.wd_newMessage || (exports.wd_newMessage = {}));
var wd_notifySendReportReceived;
(function (wd_notifySendReportReceived) {
    wd_notifySendReportReceived.methodName = "wd_notifySendReportReceived";
})(wd_notifySendReportReceived = exports.wd_notifySendReportReceived || (exports.wd_notifySendReportReceived = {}));
var wd_notifyStatusReportReceived;
(function (wd_notifyStatusReportReceived) {
    wd_notifyStatusReportReceived.methodName = "wd_notifyStatusReportReceived";
})(wd_notifyStatusReportReceived = exports.wd_notifyStatusReportReceived || (exports.wd_notifyStatusReportReceived = {}));
