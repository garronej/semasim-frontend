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
var notifyGsmConnectivityChange;
(function (notifyGsmConnectivityChange) {
    notifyGsmConnectivityChange.methodName = "notifyGsmConnectivityChange";
})(notifyGsmConnectivityChange = exports.notifyGsmConnectivityChange || (exports.notifyGsmConnectivityChange = {}));
var notifyCellSignalStrengthChange;
(function (notifyCellSignalStrengthChange) {
    notifyCellSignalStrengthChange.methodName = "notifyCellSignalStrengthChange";
})(notifyCellSignalStrengthChange = exports.notifyCellSignalStrengthChange || (exports.notifyCellSignalStrengthChange = {}));
var notifyOngoingCall;
(function (notifyOngoingCall) {
    notifyOngoingCall.methodName = "notifyOngoingCall";
})(notifyOngoingCall = exports.notifyOngoingCall || (exports.notifyOngoingCall = {}));
/** posted when an other UA create or update a contact */
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
 * or when the user unregister the sim from an other ua
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
var notifyOtherSimUserUnregisteredSim;
(function (notifyOtherSimUserUnregisteredSim) {
    notifyOtherSimUserUnregisteredSim.methodName = "notifyOtherSimUserUnregisteredSim";
})(notifyOtherSimUserUnregisteredSim = exports.notifyOtherSimUserUnregisteredSim || (exports.notifyOtherSimUserUnregisteredSim = {}));
var notifyLoggedFromOtherTab;
(function (notifyLoggedFromOtherTab) {
    notifyLoggedFromOtherTab.methodName = "notifyLoggedFromOtherTab";
})(notifyLoggedFromOtherTab = exports.notifyLoggedFromOtherTab || (exports.notifyLoggedFromOtherTab = {}));
var notifyIceServer;
(function (notifyIceServer) {
    notifyIceServer.methodName = "notifyIceServer";
})(notifyIceServer = exports.notifyIceServer || (exports.notifyIceServer = {}));
