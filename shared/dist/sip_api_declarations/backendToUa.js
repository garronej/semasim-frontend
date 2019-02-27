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
var getUaInstanceIdAndEmail;
(function (getUaInstanceIdAndEmail) {
    getUaInstanceIdAndEmail.methodName = "getUaInstanceIdAndEmail";
})(getUaInstanceIdAndEmail = exports.getUaInstanceIdAndEmail || (exports.getUaInstanceIdAndEmail = {}));
var getOrCreateInstance;
(function (getOrCreateInstance) {
    getOrCreateInstance.methodName = "getInstance";
})(getOrCreateInstance = exports.getOrCreateInstance || (exports.getOrCreateInstance = {}));
var newChat;
(function (newChat) {
    newChat.methodName = "newChat";
})(newChat = exports.newChat || (exports.newChat = {}));
var fetchOlderMessages;
(function (fetchOlderMessages) {
    fetchOlderMessages.methodName = "fetchOlderMessages";
})(fetchOlderMessages = exports.fetchOlderMessages || (exports.fetchOlderMessages = {}));
var updateChat;
(function (updateChat) {
    updateChat.methodName = "updateChat";
})(updateChat = exports.updateChat || (exports.updateChat = {}));
var destroyChat;
(function (destroyChat) {
    destroyChat.methodName = "destroyChat";
})(destroyChat = exports.destroyChat || (exports.destroyChat = {}));
var newMessage;
(function (newMessage) {
    newMessage.methodName = "newMessage";
})(newMessage = exports.newMessage || (exports.newMessage = {}));
var notifySendReportReceived;
(function (notifySendReportReceived) {
    notifySendReportReceived.methodName = "notifySendReportReceived";
})(notifySendReportReceived = exports.notifySendReportReceived || (exports.notifySendReportReceived = {}));
var notifyStatusReportReceived;
(function (notifyStatusReportReceived) {
    notifyStatusReportReceived.methodName = "notifyStatusReportReceived";
})(notifyStatusReportReceived = exports.notifyStatusReportReceived || (exports.notifyStatusReportReceived = {}));
