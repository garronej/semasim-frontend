"use strict";
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
var sendRequest_1 = require("./sendRequest");
var ts_events_extended_1 = require("ts-events-extended");
var apiDeclaration = require("../../../sip_api_declarations/backendToUa");
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
        var prUsableUserSims_ = sendRequest_1.sendRequest(methodName, { includeContacts: includeContacts });
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
        return sendRequest_1.sendRequest(methodName, { "imei": lockedDongle.imei, pin: pin });
    };
})();
exports.registerSim = (function () {
    var methodName = apiDeclaration.registerSim.methodName;
    return function (dongle, friendlyName) {
        return __awaiter(this, void 0, void 0, function () {
            var userSim;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, sendRequest_1.sendRequest(methodName, {
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
                    case 0: return [4 /*yield*/, sendRequest_1.sendRequest(methodName, { "imsi": userSim.sim.imsi })];
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
        return sendRequest_1.sendRequest(methodName, { "imsi": userSim.sim.imsi });
    };
})();
exports.shareSim = (function () {
    var methodName = apiDeclaration.shareSim.methodName;
    return function (userSim, emails, message) {
        return __awaiter(this, void 0, void 0, function () {
            var emails_1, emails_1_1, email;
            var e_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, sendRequest_1.sendRequest(methodName, { "imsi": userSim.sim.imsi, emails: emails, message: message })];
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
            var emails_2, emails_2_1, email, _a, notConfirmed, confirmed, arr, index;
            var e_2, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, sendRequest_1.sendRequest(methodName, { "imsi": userSim.sim.imsi, emails: emails })];
                    case 1:
                        _c.sent();
                        try {
                            for (emails_2 = __values(emails), emails_2_1 = emails_2.next(); !emails_2_1.done; emails_2_1 = emails_2.next()) {
                                email = emails_2_1.value;
                                _a = userSim.ownership.sharedWith, notConfirmed = _a.notConfirmed, confirmed = _a.confirmed;
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
                                if (emails_2_1 && !emails_2_1.done && (_b = emails_2.return)) _b.call(emails_2);
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
                    case 0: return [4 /*yield*/, sendRequest_1.sendRequest(methodName, { "imsi": userSim.sim.imsi, friendlyName: friendlyName })];
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
                    case 0: return [4 /*yield*/, sendRequest_1.sendRequest(methodName, { "imsi": notConfirmedUserSim.sim.imsi, friendlyName: friendlyName })];
                    case 1:
                        password = (_a.sent()).password;
                        userSim = {
                            "sim": notConfirmedUserSim.sim,
                            friendlyName: friendlyName,
                            password: password,
                            "towardSimEncryptKeyStr": notConfirmedUserSim.towardSimEncryptKeyStr,
                            "dongle": notConfirmedUserSim.dongle,
                            "gatewayLocation": notConfirmedUserSim.gatewayLocation,
                            "ownership": {
                                "status": "SHARED CONFIRMED",
                                "ownerEmail": notConfirmedUserSim.ownership.ownerEmail,
                                "otherUserEmails": notConfirmedUserSim.ownership.otherUserEmails
                            },
                            "phonebook": notConfirmedUserSim.phonebook,
                            "reachableSimState": notConfirmedUserSim.reachableSimState
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
                    case 0: return [4 /*yield*/, sendRequest_1.sendRequest(methodName, { "imsi": userSim.sim.imsi })];
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
                    case 0: return [4 /*yield*/, sendRequest_1.sendRequest(methodName, { "imsi": userSim.sim.imsi, name: name, number: number })];
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
                        return [4 /*yield*/, sendRequest_1.sendRequest(methodName, {
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
                    case 2: return [4 /*yield*/, sendRequest_1.sendRequest(methodName, {
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
                    case 0: return [4 /*yield*/, sendRequest_1.sendRequest(methodName, {
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
        return sendRequest_1.sendRequest(methodName, undefined).then(function (response) { return cachedResponse = response; });
    };
})();
