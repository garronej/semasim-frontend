"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var notifySimOffline;
(function (notifySimOffline) {
    notifySimOffline.methodName = "notifySimOffline";
})(notifySimOffline = exports.notifySimOffline || (exports.notifySimOffline = {}));
var notifySimOnline;
(function (notifySimOnline) {
    notifySimOnline.methodName = "notifySimOnline";
})(notifySimOnline = exports.notifySimOnline || (exports.notifySimOnline = {}));
/** posted when a user that share this SIM create or update a contact */
var notifyContactCreatedOrUpdated;
(function (notifyContactCreatedOrUpdated) {
    notifyContactCreatedOrUpdated.methodName = "notifyContactCreatedOrUpdated";
})(notifyContactCreatedOrUpdated = exports.notifyContactCreatedOrUpdated || (exports.notifyContactCreatedOrUpdated = {}));
var notifyContactDeleted;
(function (notifyContactDeleted) {
    notifyContactDeleted.methodName = "notifyContactDeleted";
})(notifyContactDeleted = exports.notifyContactDeleted || (exports.notifyContactDeleted = {}));
var notifyDongleOnLan;
(function (notifyDongleOnLan) {
    notifyDongleOnLan.methodName = "notifyDongleOnLan";
})(notifyDongleOnLan = exports.notifyDongleOnLan || (exports.notifyDongleOnLan = {}));
/**
 * posted when the owner of the sim stop sharing the sim with the user
 * or when the user unregister the sim.
 * */
var notifySimPermissionLost;
(function (notifySimPermissionLost) {
    notifySimPermissionLost.methodName = "notifySimPermissionLost";
})(notifySimPermissionLost = exports.notifySimPermissionLost || (exports.notifySimPermissionLost = {}));
var notifySimSharingRequest;
(function (notifySimSharingRequest) {
    notifySimSharingRequest.methodName = "notifySimSharingRequest";
})(notifySimSharingRequest = exports.notifySimSharingRequest || (exports.notifySimSharingRequest = {}));
var notifySharingRequestResponse;
(function (notifySharingRequestResponse) {
    notifySharingRequestResponse.methodName = "notifySharingRequestResponse";
})(notifySharingRequestResponse = exports.notifySharingRequestResponse || (exports.notifySharingRequestResponse = {}));
var notifySharedSimUnregistered;
(function (notifySharedSimUnregistered) {
    notifySharedSimUnregistered.methodName = "notifySharedSimUnregistered";
})(notifySharedSimUnregistered = exports.notifySharedSimUnregistered || (exports.notifySharedSimUnregistered = {}));
var notifyLoggedFromOtherTab;
(function (notifyLoggedFromOtherTab) {
    notifyLoggedFromOtherTab.methodName = "notifyLoggedFromOtherTab";
})(notifyLoggedFromOtherTab = exports.notifyLoggedFromOtherTab || (exports.notifyLoggedFromOtherTab = {}));
var notifyIceServer;
(function (notifyIceServer) {
    notifyIceServer.methodName = "notifyIceServer";
})(notifyIceServer = exports.notifyIceServer || (exports.notifyIceServer = {}));
