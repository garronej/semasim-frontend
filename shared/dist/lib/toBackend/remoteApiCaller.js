"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var sipLibrary = require("ts-sip");
var ts_events_extended_1 = require("ts-events-extended");
var apiDeclaration = require("../../sip_api_declarations/backendToUa");
var connection = require("./connection");
var phone_number_1 = require("phone-number");
var types = require("../types");
var wd = types.webphoneData;
/** Posted when user register a new sim on he's LAN or accept a sharing request */
exports.evtUsableSim = new ts_events_extended_1.SyncEvent();
//TODO: Fix, it's called two times!!
exports.getUsableUserSims = (function () {
    var methodName = apiDeclaration.getUsableUserSims.methodName;
    var prUsableUserSims = undefined;
    /**
     *
     * includeContacts is true by defaults.
     *
     * The stateless argument is used to re fetch the userSim from the server regardless
     * of if it have been done previously already, it will return a new array.
     * If the 'stateless' argument is omitted then the returned value is static.
     * ( only one request is sent to the server )
     *
     * Note that if the method have already been called and called with
     * stateless falsy includeContacts will not have any effect.
     *
     */
    return function (includeContacts, stateless) {
        if (includeContacts === void 0) { includeContacts = true; }
        if (stateless === void 0) { stateless = false; }
        if (!stateless && !!prUsableUserSims) {
            return prUsableUserSims;
        }
        var prUsableUserSims_ = sendRequest(methodName, { includeContacts: includeContacts });
        if (!!stateless) {
            return prUsableUserSims_;
        }
        else {
            prUsableUserSims = prUsableUserSims_;
            return exports.getUsableUserSims();
        }
    };
})();
exports.unlockSim = (function () {
    var methodName = apiDeclaration.unlockSim.methodName;
    return function (lockedDongle, pin) {
        return sendRequest(methodName, { "imei": lockedDongle.imei, pin: pin });
    };
})();
exports.registerSim = (function () {
    var methodName = apiDeclaration.registerSim.methodName;
    return function (dongle, friendlyName) {
        return __awaiter(this, void 0, void 0, function () {
            var userSim;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sendRequest(methodName, {
                            "imsi": dongle.sim.imsi,
                            "imei": dongle.imei,
                            friendlyName: friendlyName
                        })];
                    case 1:
                        userSim = _a.sent();
                        return [4 /*yield*/, exports.getUsableUserSims()];
                    case 2:
                        (_a.sent()).push(userSim);
                        exports.evtUsableSim.post(userSim);
                        return [2 /*return*/];
                }
            });
        });
    };
})();
exports.unregisterSim = (function () {
    var methodName = apiDeclaration.unregisterSim.methodName;
    return function (userSim) {
        return __awaiter(this, void 0, void 0, function () {
            var usableUserSims;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sendRequest(methodName, { "imsi": userSim.sim.imsi })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, exports.getUsableUserSims()];
                    case 2:
                        usableUserSims = _a.sent();
                        usableUserSims.splice(usableUserSims.indexOf(userSim), 1);
                        return [2 /*return*/];
                }
            });
        });
    };
})();
exports.rebootDongle = (function () {
    var methodName = apiDeclaration.rebootDongle.methodName;
    return function (userSim) {
        return sendRequest(methodName, { "imsi": userSim.sim.imsi });
    };
})();
exports.shareSim = (function () {
    var methodName = apiDeclaration.shareSim.methodName;
    return function (userSim, emails, message) {
        return __awaiter(this, void 0, void 0, function () {
            var e_1, _a, emails_1, emails_1_1, email;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, sendRequest(methodName, { "imsi": userSim.sim.imsi, emails: emails, message: message })];
                    case 1:
                        _b.sent();
                        try {
                            for (emails_1 = __values(emails), emails_1_1 = emails_1.next(); !emails_1_1.done; emails_1_1 = emails_1.next()) {
                                email = emails_1_1.value;
                                userSim.ownership.sharedWith.notConfirmed.push(email);
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (emails_1_1 && !emails_1_1.done && (_a = emails_1.return)) _a.call(emails_1);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
})();
exports.stopSharingSim = (function () {
    var methodName = apiDeclaration.stopSharingSim.methodName;
    return function (userSim, emails) {
        return __awaiter(this, void 0, void 0, function () {
            var e_2, _a, emails_2, emails_2_1, email, _b, notConfirmed, confirmed, arr, index;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, sendRequest(methodName, { "imsi": userSim.sim.imsi, emails: emails })];
                    case 1:
                        _c.sent();
                        try {
                            for (emails_2 = __values(emails), emails_2_1 = emails_2.next(); !emails_2_1.done; emails_2_1 = emails_2.next()) {
                                email = emails_2_1.value;
                                _b = userSim.ownership.sharedWith, notConfirmed = _b.notConfirmed, confirmed = _b.confirmed;
                                arr = void 0;
                                index = void 0;
                                index = notConfirmed.indexOf(email);
                                if (index > 0) {
                                    arr = notConfirmed;
                                }
                                else {
                                    index = confirmed.indexOf(email);
                                    arr = confirmed;
                                }
                                arr.splice(index, 1);
                            }
                        }
                        catch (e_2_1) { e_2 = { error: e_2_1 }; }
                        finally {
                            try {
                                if (emails_2_1 && !emails_2_1.done && (_a = emails_2.return)) _a.call(emails_2);
                            }
                            finally { if (e_2) throw e_2.error; }
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
})();
exports.changeSimFriendlyName = (function () {
    var methodName = apiDeclaration.changeSimFriendlyName.methodName;
    return function (userSim, friendlyName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sendRequest(methodName, { "imsi": userSim.sim.imsi, friendlyName: friendlyName })];
                    case 1:
                        _a.sent();
                        userSim.friendlyName = friendlyName;
                        return [2 /*return*/];
                }
            });
        });
    };
})();
exports.acceptSharingRequest = (function () {
    var methodName = apiDeclaration.acceptSharingRequest.methodName;
    return function (notConfirmedUserSim, friendlyName) {
        return __awaiter(this, void 0, void 0, function () {
            var password, userSim;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sendRequest(methodName, { "imsi": notConfirmedUserSim.sim.imsi, friendlyName: friendlyName })];
                    case 1:
                        password = (_a.sent()).password;
                        userSim = {
                            "sim": notConfirmedUserSim.sim,
                            friendlyName: friendlyName,
                            password: password,
                            "dongle": notConfirmedUserSim.dongle,
                            "gatewayLocation": notConfirmedUserSim.gatewayLocation,
                            "isOnline": notConfirmedUserSim.isOnline,
                            "ownership": {
                                "status": "SHARED CONFIRMED",
                                "ownerEmail": notConfirmedUserSim.ownership.ownerEmail
                            },
                            "phonebook": notConfirmedUserSim.phonebook
                        };
                        return [4 /*yield*/, exports.getUsableUserSims()];
                    case 2:
                        (_a.sent()).push(userSim);
                        exports.evtUsableSim.post(userSim);
                        return [2 /*return*/];
                }
            });
        });
    };
})();
exports.rejectSharingRequest = (function () {
    var methodName = apiDeclaration.rejectSharingRequest.methodName;
    return function (userSim) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sendRequest(methodName, { "imsi": userSim.sim.imsi })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
})();
exports.createContact = (function () {
    var methodName = apiDeclaration.createContact.methodName;
    return function (userSim, name, number) {
        return __awaiter(this, void 0, void 0, function () {
            var resp, contact;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sendRequest(methodName, { "imsi": userSim.sim.imsi, name: name, number: number })];
                    case 1:
                        resp = _a.sent();
                        contact = {
                            "mem_index": !!resp ? resp.mem_index : undefined,
                            name: name,
                            "number_raw": number
                        };
                        userSim.phonebook.push(contact);
                        if (!!resp) {
                            userSim.sim.storage.contacts.push({
                                "index": resp.mem_index,
                                name: name,
                                number: number
                            });
                            userSim.sim.storage.digest = resp.new_digest;
                            userSim.sim.storage.infos.storageLeft--;
                        }
                        return [2 /*return*/, contact];
                }
            });
        });
    };
})();
exports.updateContactName = (function () {
    var methodName = apiDeclaration.updateContactName.methodName;
    /** Assert contact is the ref of the object stored in userSim */
    return function (userSim, contact, newName) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, name_as_stored_in_sim, new_digest;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(contact.mem_index !== undefined)) return [3 /*break*/, 2];
                        return [4 /*yield*/, sendRequest(methodName, {
                                "imsi": userSim.sim.imsi,
                                "contactRef": { "mem_index": contact.mem_index },
                                newName: newName
                            })];
                    case 1:
                        _a = _b.sent(), name_as_stored_in_sim = _a.name_as_stored_in_sim, new_digest = _a.new_digest;
                        contact.name = newName;
                        userSim
                            .sim.storage.contacts.find(function (_a) {
                            var index = _a.index;
                            return index === contact.mem_index;
                        })
                            .name = name_as_stored_in_sim;
                        userSim.sim.storage.digest = new_digest;
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, sendRequest(methodName, {
                            "imsi": userSim.sim.imsi,
                            "contactRef": { "number": contact.number_raw },
                            newName: newName
                        })];
                    case 3:
                        _b.sent();
                        contact.name = newName;
                        _b.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
})();
exports.deleteContact = (function () {
    var methodName = apiDeclaration.deleteContact.methodName;
    return function (userSim, contact) {
        return __awaiter(this, void 0, void 0, function () {
            var new_digest;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sendRequest(methodName, {
                            "imsi": userSim.sim.imsi,
                            "contactRef": contact.mem_index === null ?
                                ({ "mem_index": contact.mem_index }) :
                                ({ "number": contact.number_raw })
                        })];
                    case 1:
                        new_digest = (_a.sent()).new_digest;
                        if (contact.mem_index !== null) {
                            userSim.sim.storage.contacts.splice(userSim.sim.storage.contacts.findIndex(function (_a) {
                                var index = _a.index;
                                return index === contact.mem_index;
                            }), 1);
                        }
                        userSim.phonebook.splice(userSim.phonebook.indexOf(contact), 1);
                        if (new_digest !== undefined) {
                            userSim.sim.storage.digest = new_digest;
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
})();
/** Api only called once */
exports.shouldAppendPromotionalMessage = (function () {
    var methodName = apiDeclaration.shouldAppendPromotionalMessage.methodName;
    var cachedResponse = undefined;
    return function () {
        if (cachedResponse !== undefined) {
            return cachedResponse;
        }
        return sendRequest(methodName, undefined).then(function (response) { return cachedResponse = response; });
    };
})();
exports.getUaInstanceId = (function () {
    var methodName = apiDeclaration.getUaInstanceId.methodName;
    return function () {
        return sendRequest(methodName, undefined);
    };
})();
//WebData sync things :
exports.getOrCreateWdInstance = (function () {
    var methodName = apiDeclaration.getOrCreateInstance.methodName;
    function synchronizeUserSimAndWdInstance(userSim, wdInstance) {
        return __awaiter(this, void 0, void 0, function () {
            var e_3, _a, e_4, _b, wdChatWhoseContactNoLongerInPhonebook, _loop_1, _c, _d, contact, e_3_1, wdChatWhoseContactNoLongerInPhonebook_1, wdChatWhoseContactNoLongerInPhonebook_1_1, wdChat, e_4_1;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        wdChatWhoseContactNoLongerInPhonebook = new Set(wdInstance.chats);
                        _loop_1 = function (contact) {
                            var wdChat;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        wdChat = wdInstance.chats.find(function (_a) {
                                            var contactNumber = _a.contactNumber;
                                            return phone_number_1.phoneNumber.areSame(contactNumber, contact.number_raw);
                                        });
                                        if (!!!wdChat) return [3 /*break*/, 2];
                                        wdChatWhoseContactNoLongerInPhonebook.delete(wdChat);
                                        return [4 /*yield*/, updateWdChatContactInfos(wdChat, contact.name, contact.mem_index !== undefined ? contact.mem_index : null)];
                                    case 1:
                                        _a.sent();
                                        return [3 /*break*/, 4];
                                    case 2: return [4 /*yield*/, exports.newWdChat(wdInstance, phone_number_1.phoneNumber.build(contact.number_raw, userSim.sim.country ? userSim.sim.country.iso : undefined), contact.name, contact.mem_index !== undefined ? contact.mem_index : null)];
                                    case 3:
                                        _a.sent();
                                        _a.label = 4;
                                    case 4: return [2 /*return*/];
                                }
                            });
                        };
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 6, 7, 8]);
                        _c = __values(userSim.phonebook), _d = _c.next();
                        _e.label = 2;
                    case 2:
                        if (!!_d.done) return [3 /*break*/, 5];
                        contact = _d.value;
                        return [5 /*yield**/, _loop_1(contact)];
                    case 3:
                        _e.sent();
                        _e.label = 4;
                    case 4:
                        _d = _c.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_3_1 = _e.sent();
                        e_3 = { error: e_3_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                        }
                        finally { if (e_3) throw e_3.error; }
                        return [7 /*endfinally*/];
                    case 8:
                        _e.trys.push([8, 13, 14, 15]);
                        wdChatWhoseContactNoLongerInPhonebook_1 = __values(wdChatWhoseContactNoLongerInPhonebook), wdChatWhoseContactNoLongerInPhonebook_1_1 = wdChatWhoseContactNoLongerInPhonebook_1.next();
                        _e.label = 9;
                    case 9:
                        if (!!wdChatWhoseContactNoLongerInPhonebook_1_1.done) return [3 /*break*/, 12];
                        wdChat = wdChatWhoseContactNoLongerInPhonebook_1_1.value;
                        return [4 /*yield*/, updateWdChatContactInfos(wdChat, "", null)];
                    case 10:
                        _e.sent();
                        _e.label = 11;
                    case 11:
                        wdChatWhoseContactNoLongerInPhonebook_1_1 = wdChatWhoseContactNoLongerInPhonebook_1.next();
                        return [3 /*break*/, 9];
                    case 12: return [3 /*break*/, 15];
                    case 13:
                        e_4_1 = _e.sent();
                        e_4 = { error: e_4_1 };
                        return [3 /*break*/, 15];
                    case 14:
                        try {
                            if (wdChatWhoseContactNoLongerInPhonebook_1_1 && !wdChatWhoseContactNoLongerInPhonebook_1_1.done && (_b = wdChatWhoseContactNoLongerInPhonebook_1.return)) _b.call(wdChatWhoseContactNoLongerInPhonebook_1);
                        }
                        finally { if (e_4) throw e_4.error; }
                        return [7 /*endfinally*/];
                    case 15: return [2 /*return*/];
                }
            });
        });
    }
    return function (userSim) {
        return __awaiter(this, void 0, void 0, function () {
            var imsi, _a, instance_id, chats, wdInstance;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        imsi = userSim.sim.imsi;
                        return [4 /*yield*/, sendRequest(methodName, { imsi: imsi })];
                    case 1:
                        _a = _b.sent(), instance_id = _a.instance_id, chats = _a.chats;
                        wdInstance = {
                            "id_": instance_id,
                            imsi: imsi,
                            chats: chats
                        };
                        return [4 /*yield*/, synchronizeUserSimAndWdInstance(userSim, wdInstance)];
                    case 2:
                        _b.sent();
                        return [2 /*return*/, wdInstance];
                }
            });
        });
    };
})();
exports.newWdChat = (function () {
    var methodName = apiDeclaration.newChat.methodName;
    return function (wdInstance, contactNumber, contactName, contactIndexInSim) {
        return __awaiter(this, void 0, void 0, function () {
            var chat_id, wdChat;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sendRequest(methodName, {
                            "instance_id": wdInstance.id_,
                            contactNumber: contactNumber,
                            contactName: contactName,
                            contactIndexInSim: contactIndexInSim
                        })];
                    case 1:
                        chat_id = (_a.sent()).chat_id;
                        wdChat = {
                            "id_": chat_id,
                            contactNumber: contactNumber,
                            contactName: contactName,
                            contactIndexInSim: contactIndexInSim,
                            "idOfLastMessageSeen": null,
                            "messages": []
                        };
                        wdInstance.chats.push(wdChat);
                        return [2 /*return*/, wdChat];
                }
            });
        });
    };
})();
exports.fetchOlderWdMessages = (function () {
    var methodName = apiDeclaration.fetchOlderMessages.methodName;
    return function (wdChat) {
        return __awaiter(this, void 0, void 0, function () {
            var e_5, _a, lastMessage, olderThanMessageId, olderWdMessages, set, i, message, _b, _c, message;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        lastMessage = wdChat.messages.slice(-1).pop();
                        if (!lastMessage) {
                            return [2 /*return*/, []];
                        }
                        olderThanMessageId = wdChat.messages[0].id_;
                        return [4 /*yield*/, sendRequest(methodName, {
                                "chat_id": wdChat.id_,
                                olderThanMessageId: olderThanMessageId
                            })];
                    case 1:
                        olderWdMessages = _d.sent();
                        set = new Set(wdChat.messages.map(function (_a) {
                            var id_ = _a.id_;
                            return id_;
                        }));
                        for (i = olderWdMessages.length - 1; i >= 0; i--) {
                            message = olderWdMessages[i];
                            if (set.has(message.id_)) {
                                continue;
                            }
                            wdChat.messages.unshift(message);
                        }
                        wdChat.messages.sort(wd.compareMessage);
                        olderWdMessages = [];
                        try {
                            for (_b = __values(wdChat.messages), _c = _b.next(); !_c.done; _c = _b.next()) {
                                message = _c.value;
                                if (message.id_ === olderThanMessageId) {
                                    break;
                                }
                                olderWdMessages.push(message);
                            }
                        }
                        catch (e_5_1) { e_5 = { error: e_5_1 }; }
                        finally {
                            try {
                                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                            }
                            finally { if (e_5) throw e_5.error; }
                        }
                        return [2 /*return*/, olderWdMessages];
                }
            });
        });
    };
})();
/**
 *
 * If same as before the request won't be sent
 *
 * return true if update was performed
 *
 * */
function updateWdChatIdOfLastMessageSeen(wdChat) {
    return __awaiter(this, void 0, void 0, function () {
        var message_id, i, message;
        return __generator(this, function (_a) {
            message_id = undefined;
            for (i = wdChat.messages.length - 1; i >= 0; i--) {
                message = wdChat.messages[i];
                if (message.direction === "INCOMING" ||
                    (message.status === "STATUS REPORT RECEIVED" &&
                        message.sentBy.who === "OTHER")) {
                    message_id = message.id_;
                    break;
                }
            }
            return [2 /*return*/, updateWdChat(wdChat, { "idOfLastMessageSeen": message_id })];
        });
    });
}
exports.updateWdChatIdOfLastMessageSeen = updateWdChatIdOfLastMessageSeen;
/**
 *
 * If same as before the request won't be sent
 *
 * return true if update was performed
 *
 * */
function updateWdChatContactInfos(wdChat, contactName, contactIndexInSim) {
    return updateWdChat(wdChat, {
        contactName: contactName,
        contactIndexInSim: contactIndexInSim
    });
}
exports.updateWdChatContactInfos = updateWdChatContactInfos;
var updateWdChat = (function () {
    var methodName = apiDeclaration.updateChat.methodName;
    /**
     *
     * If same as before the request won't be sent
     *
     * return true if update performed
     *
     * */
    return function (wdChat, fields) {
        return __awaiter(this, void 0, void 0, function () {
            var params, key, value, key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = { "chat_id": wdChat.id_ };
                        for (key in fields) {
                            value = fields[key];
                            if (value === undefined || wdChat[key] === value) {
                                continue;
                            }
                            params[key] = value;
                        }
                        if (Object.keys(params).length === 1) {
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, sendRequest(methodName, params)];
                    case 1:
                        _a.sent();
                        delete params.chat_id;
                        for (key in params) {
                            wdChat[key] = params[key];
                        }
                        return [2 /*return*/, true];
                }
            });
        });
    };
})();
exports.destroyWdChat = (function () {
    var methodName = apiDeclaration.destroyChat.methodName;
    return function (wdInstance, wdChat) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sendRequest(methodName, { "chat_id": wdChat.id_ })];
                    case 1:
                        _a.sent();
                        wdInstance.chats.splice(wdInstance.chats.indexOf(wdChat), 1);
                        return [2 /*return*/];
                }
            });
        });
    };
})();
function newWdMessage(wdChat, message_) {
    return __awaiter(this, void 0, void 0, function () {
        var message, isSameWdMessage, methodName, message_id, wdMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = message_;
                    isSameWdMessage = function (wdMessage) {
                        var areSame = function (o1, o2) {
                            for (var key in o1) {
                                var value = o1[key];
                                if (value instanceof Object) {
                                    if (!areSame(value, o2[key])) {
                                        return false;
                                    }
                                }
                                else {
                                    if (value !== o2[key]) {
                                        return false;
                                    }
                                }
                            }
                            return true;
                        };
                        return areSame(wdMessage, message_);
                    };
                    if (!!wdChat.messages.find(isSameWdMessage)) {
                        return [2 /*return*/, undefined];
                    }
                    methodName = apiDeclaration.newMessage.methodName;
                    return [4 /*yield*/, sendRequest(methodName, { "chat_id": wdChat.id_, message: message })];
                case 1:
                    message_id = (_a.sent()).message_id;
                    wdMessage = (__assign({}, message, { "id_": message_id }));
                    wdChat.messages.push(wdMessage);
                    wdChat.messages.sort(wd.compareMessage);
                    return [2 /*return*/, wdMessage];
            }
        });
    });
}
exports.newWdMessage = newWdMessage;
function notifyUaFailedToSendMessage(wdChat, wdMessage) {
    return _notifySendReportReceived(wdChat, wdMessage, false);
}
exports.notifyUaFailedToSendMessage = notifyUaFailedToSendMessage;
function notifySendReportReceived(wdChat, sendReportBundledData) {
    var wdMessage = (function () {
        for (var i = wdChat.messages.length - 1; i >= 0; i--) {
            var message = wdChat.messages[i];
            if (message.direction === "OUTGOING" &&
                message.status === "PENDING" &&
                message.time === sendReportBundledData.messageTowardGsm.date.getTime()) {
                return message;
            }
        }
        return undefined;
    })();
    if (!wdMessage) {
        return Promise.resolve(undefined);
    }
    var isSentSuccessfully = sendReportBundledData.sendDate !== null;
    return _notifySendReportReceived(wdChat, wdMessage, isSentSuccessfully);
}
exports.notifySendReportReceived = notifySendReportReceived;
var _notifySendReportReceived = (function () {
    var methodName = apiDeclaration.notifySendReportReceived.methodName;
    return function (wdChat, wdMessage, isSentSuccessfully) {
        return __awaiter(this, void 0, void 0, function () {
            var updatedWdMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sendRequest(methodName, {
                            "message_id": wdMessage.id_,
                            isSentSuccessfully: isSentSuccessfully
                        })];
                    case 1:
                        _a.sent();
                        updatedWdMessage = {
                            "id_": wdMessage.id_,
                            "time": wdMessage.time,
                            "direction": "OUTGOING",
                            "text": wdMessage.text,
                            "status": "SEND REPORT RECEIVED",
                            isSentSuccessfully: isSentSuccessfully
                        };
                        wdChat.messages[wdChat.messages.indexOf(wdMessage)] = updatedWdMessage;
                        wdChat.messages.sort(wd.compareMessage);
                        return [2 /*return*/, updatedWdMessage];
                }
            });
        });
    };
})();
exports.notifyStatusReportReceived = (function () {
    var methodName = apiDeclaration.notifyStatusReportReceived.methodName;
    /** Assert the status report state that the message was sent from this device. */
    return function (wdChat, statusReportBundledData) {
        return __awaiter(this, void 0, void 0, function () {
            var wdMessage, deliveredTime, updatedWdMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        wdMessage = (function () {
                            for (var i = wdChat.messages.length - 1; i >= 0; i--) {
                                var message = wdChat.messages[i];
                                if (message.direction === "OUTGOING" &&
                                    message.status === "SEND REPORT RECEIVED" &&
                                    message.time === statusReportBundledData.messageTowardGsm.date.getTime()) {
                                    return message;
                                }
                            }
                            return undefined;
                        })();
                        if (!wdMessage) {
                            return [2 /*return*/, undefined];
                        }
                        deliveredTime = statusReportBundledData.statusReport.isDelivered ?
                            statusReportBundledData.statusReport.dischargeDate.getTime() : null;
                        return [4 /*yield*/, sendRequest(methodName, {
                                "message_id": wdMessage.id_,
                                deliveredTime: deliveredTime
                            })];
                    case 1:
                        _a.sent();
                        updatedWdMessage = {
                            "id_": wdMessage.id_,
                            "time": wdMessage.time,
                            "direction": "OUTGOING",
                            "text": wdMessage.text,
                            "sentBy": { "who": "USER" },
                            "status": "STATUS REPORT RECEIVED",
                            deliveredTime: deliveredTime
                        };
                        wdChat.messages[wdChat.messages.indexOf(wdMessage)] = updatedWdMessage;
                        wdChat.messages.sort(wd.compareMessage);
                        return [2 /*return*/, updatedWdMessage];
                }
            });
        });
    };
})();
function sendRequest(methodName, params, retry) {
    return __awaiter(this, void 0, void 0, function () {
        var response, _a, _b, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    _b = (_a = sipLibrary.api.client).sendRequest;
                    return [4 /*yield*/, connection.get()];
                case 1:
                    response = _b.apply(_a, [_c.sent(),
                        methodName,
                        params,
                        { "timeout": 60 * 1000 }]);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _c.sent();
                    if (!!retry) {
                        return [2 /*return*/, sendRequest(methodName, params, "RETRY")];
                    }
                    else {
                        throw error_1;
                    }
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/, response];
            }
        });
    });
}
