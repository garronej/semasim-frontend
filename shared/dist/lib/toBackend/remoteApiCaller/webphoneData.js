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
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWdApiFactory = void 0;
var apiDeclaration = require("../../../sip_api_declarations/backendToUa");
var md5 = require("md5");
var cryptoLib = require("../../crypto/cryptoLibProxy");
var evt_1 = require("evt");
var createObjectWithGivenRef_1 = require("../../../tools/createObjectWithGivenRef");
var id_1 = require("../../../tools/typeSafety/id");
var typeSafety_1 = require("../../../tools/typeSafety");
var serializer_1 = require("crypto-lib/dist/async/serializer");
var types = require("../../types");
var hash = md5;
//NOTE: time and direction are plain in db, ref does not need to be secure.
var buildWdMessageRef = function (time, direction) { return hash("" + time + direction); };
/** Inject send request only when testing */
function getWdApiFactory(params) {
    var _this = this;
    var sendRequest = params.sendRequest, remoteNotifyEvts = params.remoteNotifyEvts, encryptorDecryptor = params.encryptorDecryptor, userEmail = params.userEmail;
    var decryptChat = types.wd.Chat.decryptFactory({ decryptThenParseFactory: serializer_1.decryptThenParseFactory });
    var decryptMessage = types.wd.Message.decryptFactory({ decryptThenParseFactory: serializer_1.decryptThenParseFactory });
    var stringifyThenEncrypt = cryptoLib.stringifyThenEncryptFactory(encryptorDecryptor);
    var evtRequestProcessedByBackend = new evt_1.Evt();
    evtRequestProcessedByBackend.setMaxHandlers(50);
    var onRequestProcessedByBackend = function (requestProcessedByBackend) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var count = 0;
                    var evtData = __assign(__assign({}, requestProcessedByBackend), { "handlerCb": function (error) {
                            if (!!error) {
                                reject(error);
                                return;
                            }
                            count++;
                            if (handlerCount !== count) {
                                return;
                            }
                            resolve();
                        } });
                    var handlerCount = evtRequestProcessedByBackend
                        .getHandlers()
                        .filter(function (_a) {
                        var op = _a.op;
                        return !!evtRequestProcessedByBackend
                            .getStatelessOp(op)(evtData);
                    })
                        .length;
                    typeSafety_1.assert(handlerCount !== 0);
                    evtRequestProcessedByBackend.post(evtData);
                })];
        });
    }); };
    remoteNotifyEvts.evtWdActionFromOtherUa.attach(function (evtData) { return evtRequestProcessedByBackend.post(evtData); });
    var getGetWdEvts = getGetGetWdEvts({
        encryptorDecryptor: encryptorDecryptor,
        evtRequestProcessedByBackend: evtRequestProcessedByBackend,
        decryptMessage: decryptMessage
    });
    return function getWdApi(_a) {
        var _this = this;
        var imsi = _a.imsi;
        var getWdEvts = getGetWdEvts(imsi);
        var wdApi = {
            "getUserSimChats": (function () {
                var methodName = apiDeclaration.wd_getUserSimChats.methodName;
                return function (_a) {
                    var maxMessageCountByChat = _a.maxMessageCountByChat;
                    return __awaiter(this, void 0, void 0, function () {
                        var wdEncryptedChats, wdChats, wdChats_1, wdChats_1_1, wdChat;
                        var e_1, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0: return [4 /*yield*/, sendRequest(methodName, { imsi: imsi, maxMessageCountByChat: maxMessageCountByChat })];
                                case 1:
                                    wdEncryptedChats = _c.sent();
                                    return [4 /*yield*/, Promise.all(wdEncryptedChats.map(function (chat) { return decryptChat({
                                            "decryptor": encryptorDecryptor,
                                            chat: chat
                                        }); }))];
                                case 2:
                                    wdChats = _c.sent();
                                    try {
                                        for (wdChats_1 = __values(wdChats), wdChats_1_1 = wdChats_1.next(); !wdChats_1_1.done; wdChats_1_1 = wdChats_1.next()) {
                                            wdChat = wdChats_1_1.value;
                                            wdChat.messages.sort(types.wd.Message.compare);
                                        }
                                    }
                                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                                    finally {
                                        try {
                                            if (wdChats_1_1 && !wdChats_1_1.done && (_b = wdChats_1.return)) _b.call(wdChats_1);
                                        }
                                        finally { if (e_1) throw e_1.error; }
                                    }
                                    return [2 /*return*/, { wdChats: wdChats, "wdEvts": getWdEvts(wdChats) }];
                            }
                        });
                    });
                };
            })(),
            /** If there is already a chat with the contact number nothing will be done */
            "newChat": (function () {
                var methodName = apiDeclaration.wd_newChat.methodName;
                return function (_a) {
                    var wdChats = _a.wdChats, contactNumber = _a.contactNumber, contactName = _a.contactName, contactIndexInSim = _a.contactIndexInSim;
                    return __awaiter(this, void 0, void 0, function () {
                        var chatRef, params;
                        var _this = this;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    chatRef = hash("" + imsi + contactNumber);
                                    if (!!wdChats.find(function (_a) {
                                        var ref = _a.ref;
                                        return ref === chatRef;
                                    })) {
                                        return [2 /*return*/];
                                    }
                                    return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                                            var _a, encryptedContactNumber, encryptedContactName, encryptedContactIndexInSim;
                                            return __generator(this, function (_b) {
                                                switch (_b.label) {
                                                    case 0: return [4 /*yield*/, Promise.all([contactNumber, contactName, contactIndexInSim]
                                                            .map(function (v) { return stringifyThenEncrypt(v); }))];
                                                    case 1:
                                                        _a = __read.apply(void 0, [_b.sent(), 3]), encryptedContactNumber = _a[0], encryptedContactName = _a[1], encryptedContactIndexInSim = _a[2];
                                                        return [2 /*return*/, {
                                                                imsi: imsi,
                                                                chatRef: chatRef,
                                                                "contactNumber": { "encrypted_string": encryptedContactNumber },
                                                                "contactName": { "encrypted_string": encryptedContactName },
                                                                "contactIndexInSim": { "encrypted_number_or_null": encryptedContactIndexInSim }
                                                            }];
                                                }
                                            });
                                        }); })()];
                                case 1:
                                    params = _b.sent();
                                    return [4 /*yield*/, sendRequest(methodName, params)];
                                case 2:
                                    _b.sent();
                                    return [4 /*yield*/, onRequestProcessedByBackend({ methodName: methodName, params: params })];
                                case 3:
                                    _b.sent();
                                    return [2 /*return*/];
                            }
                        });
                    });
                };
            })(),
            "fetchOlderMessages": (function () {
                var methodName = apiDeclaration.wd_fetchOlderMessages.methodName;
                return function (_a) {
                    var wdChat = _a.wdChat, maxMessageCount = _a.maxMessageCount;
                    return __awaiter(this, void 0, void 0, function () {
                        var wdMessages, olderThanMessage, olderWdMessages, _b, _c, set, i, message, wdMessages_1, wdMessages_1_1, message;
                        var e_2, _d;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0:
                                    wdMessages = wdChat.messages;
                                    if (wdMessages.length === 0) {
                                        return [2 /*return*/, []];
                                    }
                                    olderThanMessage = wdMessages[0];
                                    _c = (_b = Promise).all;
                                    return [4 /*yield*/, sendRequest(methodName, {
                                            imsi: imsi,
                                            "chatRef": wdChat.ref,
                                            "olderThanTime": olderThanMessage.time,
                                            maxMessageCount: maxMessageCount
                                        })];
                                case 1: return [4 /*yield*/, _c.apply(_b, [(_e.sent()).map(function (encryptedOlderMessage) {
                                            return decryptMessage({
                                                "decryptor": encryptorDecryptor,
                                                "encryptedMessage": encryptedOlderMessage
                                            });
                                        })])];
                                case 2:
                                    olderWdMessages = _e.sent();
                                    set = new Set(wdMessages.map(function (_a) {
                                        var ref = _a.ref;
                                        return ref;
                                    }));
                                    for (i = olderWdMessages.length - 1; i >= 0; i--) {
                                        message = olderWdMessages[i];
                                        if (set.has(message.ref)) {
                                            continue;
                                        }
                                        wdMessages.unshift(message);
                                    }
                                    wdMessages.sort(types.wd.Message.compare);
                                    olderWdMessages = [];
                                    try {
                                        for (wdMessages_1 = __values(wdMessages), wdMessages_1_1 = wdMessages_1.next(); !wdMessages_1_1.done; wdMessages_1_1 = wdMessages_1.next()) {
                                            message = wdMessages_1_1.value;
                                            if (message.ref === olderThanMessage.ref) {
                                                break;
                                            }
                                            olderWdMessages.push(message);
                                        }
                                    }
                                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                                    finally {
                                        try {
                                            if (wdMessages_1_1 && !wdMessages_1_1.done && (_d = wdMessages_1.return)) _d.call(wdMessages_1);
                                        }
                                        finally { if (e_2) throw e_2.error; }
                                    }
                                    return [2 /*return*/, olderWdMessages];
                            }
                        });
                    });
                };
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
            "updateChatLastMessageSeen": (function () {
                var methodName = apiDeclaration.wd_updateChatLastMessageSeen.methodName;
                return function (wdChat) {
                    return __awaiter(this, void 0, void 0, function () {
                        var messageRef, params;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    messageRef = (function () {
                                        for (var i = wdChat.messages.length - 1; i >= 0; i--) {
                                            var message = wdChat.messages[i];
                                            if (message.direction === "INCOMING" ||
                                                (message.status === "STATUS REPORT RECEIVED" &&
                                                    message.sentBy.who === "OTHER")) {
                                                return message.ref;
                                            }
                                        }
                                        return undefined;
                                    })();
                                    if (messageRef === undefined ||
                                        messageRef === wdChat.refOfLastMessageSeen) {
                                        return [2 /*return*/];
                                    }
                                    params = {
                                        imsi: imsi,
                                        "chatRef": wdChat.ref,
                                        "refOfLastMessageSeen": messageRef
                                    };
                                    return [4 /*yield*/, sendRequest(methodName, params)];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, onRequestProcessedByBackend({ methodName: methodName, params: params })];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    });
                };
            })(),
            /**
             *
             * If same as before the request won't be sent
             *
             * */
            "updateChatContactInfos": (function () {
                var methodName = apiDeclaration.wd_updateChatContactInfos.methodName;
                return function (_a) {
                    var wdChat = _a.wdChat, contactName = _a.contactName, contactIndexInSim = _a.contactIndexInSim;
                    return __awaiter(this, void 0, void 0, function () {
                        var fields, params, _b, _c, key, value, _d, _e, _f, _g, _h, _j, _k, _l, _m, e_3_1;
                        var e_3, _o;
                        return __generator(this, function (_p) {
                            switch (_p.label) {
                                case 0:
                                    fields = {
                                        contactName: contactName,
                                        contactIndexInSim: contactIndexInSim
                                    };
                                    params = { imsi: imsi, "chatRef": wdChat.ref };
                                    _p.label = 1;
                                case 1:
                                    _p.trys.push([1, 9, 10, 11]);
                                    _b = __values(Object.keys(fields)), _c = _b.next();
                                    _p.label = 2;
                                case 2:
                                    if (!!_c.done) return [3 /*break*/, 8];
                                    key = _c.value;
                                    value = fields[key];
                                    if (value === undefined || wdChat[key] === value) {
                                        return [3 /*break*/, 7];
                                    }
                                    _d = key;
                                    switch (_d) {
                                        case "contactName": return [3 /*break*/, 3];
                                        case "contactIndexInSim": return [3 /*break*/, 5];
                                    }
                                    return [3 /*break*/, 7];
                                case 3:
                                    _e = params;
                                    _f = key;
                                    _g = {};
                                    _h = "encrypted_string";
                                    return [4 /*yield*/, stringifyThenEncrypt(value)];
                                case 4:
                                    _e[_f] = (_g[_h] = _p.sent(),
                                        _g);
                                    return [3 /*break*/, 7];
                                case 5:
                                    _j = params;
                                    _k = key;
                                    _l = {};
                                    _m = "encrypted_number_or_null";
                                    return [4 /*yield*/, stringifyThenEncrypt(value)];
                                case 6:
                                    _j[_k] = (_l[_m] = _p.sent(),
                                        _l);
                                    return [3 /*break*/, 7];
                                case 7:
                                    _c = _b.next();
                                    return [3 /*break*/, 2];
                                case 8: return [3 /*break*/, 11];
                                case 9:
                                    e_3_1 = _p.sent();
                                    e_3 = { error: e_3_1 };
                                    return [3 /*break*/, 11];
                                case 10:
                                    try {
                                        if (_c && !_c.done && (_o = _b.return)) _o.call(_b);
                                    }
                                    finally { if (e_3) throw e_3.error; }
                                    return [7 /*endfinally*/];
                                case 11:
                                    if (Object.keys(params).length === 2) {
                                        return [2 /*return*/];
                                    }
                                    return [4 /*yield*/, sendRequest(methodName, params)];
                                case 12:
                                    _p.sent();
                                    return [4 /*yield*/, onRequestProcessedByBackend({ methodName: methodName, params: params })];
                                case 13:
                                    _p.sent();
                                    return [2 /*return*/];
                            }
                        });
                    });
                };
            })(),
            "destroyWdChat": (function () {
                var methodName = apiDeclaration.wd_destroyChat.methodName;
                return function (_a) {
                    var wdChats = _a.wdChats, refOfTheChatToDelete = _a.refOfTheChatToDelete;
                    return __awaiter(this, void 0, void 0, function () {
                        var wdChat, params;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    wdChat = wdChats.find(function (_a) {
                                        var ref = _a.ref;
                                        return ref == refOfTheChatToDelete;
                                    });
                                    if (!wdChat) {
                                        return [2 /*return*/];
                                    }
                                    params = { imsi: imsi, "chatRef": refOfTheChatToDelete };
                                    return [4 /*yield*/, sendRequest(methodName, params)];
                                case 1:
                                    _b.sent();
                                    return [4 /*yield*/, onRequestProcessedByBackend({ methodName: methodName, params: params })];
                                case 2:
                                    _b.sent();
                                    return [2 /*return*/];
                            }
                        });
                    });
                };
            })(),
            /**
             * gwTypes.BundledData.ClientToServer.Message is assignable
             * to arg0.bundledData * ( client to server )
             * */
            "newMessage": (function () {
                var methodName = apiDeclaration.wd_newMessage.methodName;
                function out(args) {
                    return __awaiter(this, void 0, void 0, function () {
                        var wdChat, _a, wdMessage, onUaFailedToSendMessage, params, _b, _c, _d, _e, _f, _g, _h;
                        return __generator(this, function (_j) {
                            switch (_j.label) {
                                case 0:
                                    wdChat = args.wdChat;
                                    _a = __read((function () {
                                        switch (args.type) {
                                            case "SERVER TO CLIENT":
                                                {
                                                    var bundledData_1 = args.bundledData;
                                                    var direction_1 = "INCOMING";
                                                    return [
                                                        bundledData_1.type === "MESSAGE" ?
                                                            (function () {
                                                                var time = bundledData_1.pduDateTime;
                                                                return id_1.id({
                                                                    "ref": buildWdMessageRef(time, direction_1),
                                                                    time: time,
                                                                    direction: direction_1,
                                                                    "text": bundledData_1.text,
                                                                    "isNotification": false
                                                                });
                                                            })()
                                                            :
                                                                (function () {
                                                                    var time = (function () {
                                                                        switch (bundledData_1.type) {
                                                                            case "CALL ANSWERED BY":
                                                                            case "MISSED CALL":
                                                                                return bundledData_1.dateTime;
                                                                            case "MMS NOTIFICATION":
                                                                                return bundledData_1.pduDateTime;
                                                                            case "FROM SIP CALL SUMMARY":
                                                                                return bundledData_1.callPlacedAtDateTime;
                                                                        }
                                                                    })();
                                                                    return id_1.id({
                                                                        "ref": buildWdMessageRef(time, direction_1),
                                                                        time: time,
                                                                        direction: direction_1,
                                                                        "text": bundledData_1.text,
                                                                        "isNotification": true,
                                                                    });
                                                                })(),
                                                        undefined
                                                    ];
                                                }
                                                ;
                                            case "CLIENT TO SERVER":
                                                {
                                                    var bundledData = args.bundledData;
                                                    var time = bundledData.exactSendDateTime;
                                                    var direction = "OUTGOING";
                                                    var wdMessage_1 = {
                                                        "ref": buildWdMessageRef(time, direction),
                                                        time: time,
                                                        direction: direction,
                                                        "status": "PENDING",
                                                        "text": bundledData.text
                                                    };
                                                    return [
                                                        wdMessage_1,
                                                        //NOTE: Hack
                                                        function () { return wdApi.notifySendReportReceived({
                                                            wdChat: wdChat,
                                                            "bundledData": {
                                                                "sendDateTime": null,
                                                                "messageTowardGsm": {
                                                                    "dateTime": wdMessage_1.time,
                                                                    "text": wdMessage_1.text
                                                                }
                                                            }
                                                        }); }
                                                    ];
                                                }
                                                ;
                                        }
                                    })(), 2), wdMessage = _a[0], onUaFailedToSendMessage = _a[1];
                                    if (!!wdChat.messages.find(function (_a) {
                                        var ref = _a.ref;
                                        return ref === wdMessage.ref;
                                    })) {
                                        return [2 /*return*/];
                                    }
                                    _b = {
                                        imsi: imsi,
                                        "chatRef": wdChat.ref
                                    };
                                    _c = "message";
                                    _d = [__assign({}, wdMessage)];
                                    _e = {};
                                    _f = "text";
                                    _g = {};
                                    _h = "encrypted_string";
                                    return [4 /*yield*/, stringifyThenEncrypt(wdMessage.text)];
                                case 1:
                                    params = (_b[_c] = __assign.apply(void 0, _d.concat([(_e[_f] = (_g[_h] = _j.sent(), _g), _e)])),
                                        _b);
                                    return [4 /*yield*/, sendRequest(methodName, params)];
                                case 2:
                                    _j.sent();
                                    return [4 /*yield*/, onRequestProcessedByBackend({ methodName: methodName, params: params })];
                                case 3:
                                    _j.sent();
                                    if (!onUaFailedToSendMessage) {
                                        return [2 /*return*/];
                                    }
                                    return [2 /*return*/, { onUaFailedToSendMessage: onUaFailedToSendMessage }];
                            }
                        });
                    });
                }
                ;
                return out;
            })(),
            /**gwTypes.BundledData.ServerToClient.SendReport is assignable to bundledData*/
            "notifySendReportReceived": (function () {
                var methodName = apiDeclaration.wd_notifySendReportReceived.methodName;
                return function callee(_a) {
                    var wdChat = _a.wdChat, bundledData = _a.bundledData;
                    return __awaiter(this, void 0, void 0, function () {
                        var time, direction, wdMessageRef, wdMessage, params;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    time = bundledData.messageTowardGsm.dateTime;
                                    direction = "OUTGOING";
                                    wdMessageRef = buildWdMessageRef(time, direction);
                                    wdMessage = wdChat.messages
                                        .find(function (_a) {
                                        var ref = _a.ref;
                                        return ref === wdMessageRef;
                                    });
                                    if (wdMessage !== undefined && wdMessage.status !== "PENDING") {
                                        return [2 /*return*/];
                                    }
                                    if (!(wdMessage === undefined)) return [3 /*break*/, 3];
                                    return [4 /*yield*/, wdApi.newMessage({
                                            wdChat: wdChat,
                                            "type": "CLIENT TO SERVER",
                                            "bundledData": {
                                                "exactSendDateTime": time,
                                                "text": bundledData.messageTowardGsm.text
                                            }
                                        })];
                                case 1:
                                    _b.sent();
                                    return [4 /*yield*/, callee({ wdChat: wdChat, bundledData: bundledData })];
                                case 2:
                                    _b.sent();
                                    return [2 /*return*/];
                                case 3:
                                    params = {
                                        imsi: imsi,
                                        "chatRef": wdChat.ref,
                                        "messageRef": wdMessageRef,
                                        "isSentSuccessfully": bundledData.sendDateTime !== null
                                    };
                                    return [4 /*yield*/, sendRequest(methodName, params)];
                                case 4:
                                    _b.sent();
                                    return [4 /*yield*/, onRequestProcessedByBackend({ methodName: methodName, params: params })];
                                case 5:
                                    _b.sent();
                                    return [2 /*return*/];
                            }
                        });
                    });
                };
            })(),
            "notifyStatusReportReceived": (function () {
                var methodName = apiDeclaration.wd_notifyStatusReportReceived.methodName;
                return function callee(_a) {
                    var wdChat = _a.wdChat, bundledData = _a.bundledData;
                    return __awaiter(this, void 0, void 0, function () {
                        var time, direction, wdMessageRef, wdMessage, deliveredTime, sentBy, params, _b, _c, _d, _e, _f, _g, _h;
                        return __generator(this, function (_j) {
                            switch (_j.label) {
                                case 0:
                                    time = bundledData.messageTowardGsm.dateTime;
                                    direction = "OUTGOING";
                                    wdMessageRef = buildWdMessageRef(time, direction);
                                    wdMessage = wdChat.messages
                                        .find(function (_a) {
                                        var ref = _a.ref;
                                        return ref === wdMessageRef;
                                    });
                                    if (wdMessage !== undefined && wdMessage.status === "STATUS REPORT RECEIVED") {
                                        return [2 /*return*/];
                                    }
                                    if (!(wdMessage === undefined || wdMessage.status === "PENDING")) return [3 /*break*/, 3];
                                    return [4 /*yield*/, wdApi.notifySendReportReceived({
                                            wdChat: wdChat,
                                            "bundledData": {
                                                "sendDateTime": bundledData.statusReport.sendDateTime,
                                                "messageTowardGsm": bundledData.messageTowardGsm
                                            }
                                        })];
                                case 1:
                                    _j.sent();
                                    return [4 /*yield*/, callee({ wdChat: wdChat, bundledData: bundledData })];
                                case 2:
                                    _j.sent();
                                    return [2 /*return*/];
                                case 3:
                                    deliveredTime = bundledData.statusReport.isDelivered ?
                                        bundledData.statusReport.dischargeDateTime : null;
                                    sentBy = bundledData.messageTowardGsm.uaSim.ua.userEmail === userEmail ?
                                        ({ "who": "USER" }) :
                                        ({ "who": "OTHER", "email": bundledData.messageTowardGsm.uaSim.ua.userEmail });
                                    _b = {
                                        imsi: imsi,
                                        "chatRef": wdChat.ref,
                                        "messageRef": wdMessageRef,
                                        deliveredTime: deliveredTime
                                    };
                                    _c = "sentBy";
                                    if (!(sentBy.who === "USER")) return [3 /*break*/, 4];
                                    _d = sentBy;
                                    return [3 /*break*/, 6];
                                case 4:
                                    _e = {
                                        "who": "OTHER"
                                    };
                                    _f = "email";
                                    _g = {};
                                    _h = "encrypted_string";
                                    return [4 /*yield*/, stringifyThenEncrypt(sentBy.email)];
                                case 5:
                                    _d = (_e[_f] = (_g[_h] = _j.sent(), _g),
                                        _e);
                                    _j.label = 6;
                                case 6:
                                    params = (_b[_c] = _d,
                                        _b);
                                    return [4 /*yield*/, sendRequest(methodName, params)];
                                case 7:
                                    _j.sent();
                                    return [4 /*yield*/, onRequestProcessedByBackend({ methodName: methodName, params: params })];
                                case 8:
                                    _j.sent();
                                    return [2 /*return*/];
                            }
                        });
                    });
                };
            })(),
            /** Hack so we don't have to handle special case when UA can't send message */
            "notifyUaFailedToSendMessage": function (wdChat, wdMessage) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, wdApi.notifySendReportReceived({
                                wdChat: wdChat,
                                "bundledData": {
                                    "sendDateTime": null,
                                    "messageTowardGsm": {
                                        "dateTime": wdMessage.time,
                                        "text": wdMessage.text
                                    }
                                }
                            })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); }
        };
        return wdApi;
    };
}
exports.getWdApiFactory = getWdApiFactory;
function getGetGetWdEvts(params) {
    var encryptorDecryptor = params.encryptorDecryptor, evtRequestProcessedByBackend = params.evtRequestProcessedByBackend, decryptMessage = params.decryptMessage;
    var decryptThenParse = cryptoLib.decryptThenParseFactory(encryptorDecryptor);
    return function getGetWdEvts(imsi) {
        return function getWdEvts(wdChats) {
            var _this = this;
            var out = {
                "evtWdChat": new evt_1.Evt(),
                "evtWdMessage": new evt_1.Evt()
            };
            evtRequestProcessedByBackend.attach(function (_a) {
                var imsi_ = _a.params.imsi;
                return imsi_ === imsi;
            }, function (evtData) { return __awaiter(_this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    return [2 /*return*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                            var _a, params_1, chatRef_1, _b, contactNumber, contactName, contactIndexInSim, wdChat, params_2, wdChat, params_3, indexBefore, wdChat, _c, contactName, contactIndexInSim, params_4, wdChat, params_5, indexBefore, wdChat, wdMessage_2, params_6, wdChatIndexBefore, wdChat, wdMessage, wdMessageIndexBefore, params_7, wdChatIndexBefore, wdChat, wdMessage_beforeUpdate_1, wdMessage, _d, _e, wdMessageIndexBefore;
                            var _this = this;
                            return __generator(this, function (_f) {
                                switch (_f.label) {
                                    case 0:
                                        _a = evtData.methodName;
                                        switch (_a) {
                                            case "wd_newChat": return [3 /*break*/, 1];
                                            case "wd_updateChatLastMessageSeen": return [3 /*break*/, 3];
                                            case "wd_updateChatContactInfos": return [3 /*break*/, 4];
                                            case "wd_destroyChat": return [3 /*break*/, 6];
                                            case "wd_newMessage": return [3 /*break*/, 7];
                                            case "wd_notifySendReportReceived": return [3 /*break*/, 9];
                                            case "wd_notifyStatusReportReceived": return [3 /*break*/, 10];
                                        }
                                        return [3 /*break*/, 12];
                                    case 1:
                                        params_1 = evtData.params;
                                        chatRef_1 = params_1.chatRef;
                                        if (!!wdChats.find(function (_a) {
                                            var ref = _a.ref;
                                            return ref === chatRef_1;
                                        })) {
                                            return [2 /*return*/];
                                        }
                                        return [4 /*yield*/, Promise.all([
                                                decryptThenParse(params_1.contactNumber.encrypted_string),
                                                decryptThenParse(params_1.contactName.encrypted_string),
                                                decryptThenParse(params_1.contactIndexInSim.encrypted_number_or_null)
                                            ])];
                                    case 2:
                                        _b = __read.apply(void 0, [_f.sent(), 3]), contactNumber = _b[0], contactName = _b[1], contactIndexInSim = _b[2];
                                        wdChat = {
                                            "ref": chatRef_1,
                                            contactNumber: contactNumber,
                                            contactName: contactName,
                                            contactIndexInSim: contactIndexInSim,
                                            "refOfLastMessageSeen": null,
                                            "messages": []
                                        };
                                        wdChats.push(wdChat);
                                        wdChats.sort(types.wd.Chat.compare);
                                        out.evtWdChat.post({ wdChat: wdChat, "eventType": "NEW" });
                                        return [3 /*break*/, 12];
                                    case 3:
                                        {
                                            params_2 = evtData.params;
                                            wdChat = wdChats.find(function (_a) {
                                                var ref = _a.ref;
                                                return ref === params_2.chatRef;
                                            });
                                            if (!wdChat) {
                                                return [2 /*return*/];
                                            }
                                            wdChat.refOfLastMessageSeen = params_2.refOfLastMessageSeen;
                                            out.evtWdChat.post({
                                                wdChat: wdChat,
                                                "eventType": "UPDATED",
                                                "changes": {
                                                    "unreadMessageCount": true,
                                                    "contactInfos": false,
                                                    "ordering": false
                                                }
                                            });
                                        }
                                        return [3 /*break*/, 12];
                                    case 4:
                                        params_3 = evtData.params;
                                        indexBefore = wdChats
                                            .findIndex(function (_a) {
                                            var ref = _a.ref;
                                            return ref === params_3.chatRef;
                                        });
                                        if (indexBefore < 0) {
                                            return [2 /*return*/];
                                        }
                                        wdChat = wdChats[indexBefore];
                                        return [4 /*yield*/, Promise.all([
                                                params_3.contactName !== undefined ?
                                                    decryptThenParse(params_3.contactName.encrypted_string) : undefined,
                                                params_3.contactIndexInSim !== undefined ?
                                                    decryptThenParse(params_3.contactIndexInSim.encrypted_number_or_null) : undefined
                                            ])];
                                    case 5:
                                        _c = __read.apply(void 0, [_f.sent(), 2]), contactName = _c[0], contactIndexInSim = _c[1];
                                        if (contactName !== undefined) {
                                            wdChat.contactName = contactName;
                                        }
                                        if (contactIndexInSim !== undefined) {
                                            wdChat.contactIndexInSim = contactIndexInSim;
                                        }
                                        wdChats.sort(types.wd.Chat.compare);
                                        out.evtWdChat.post({
                                            wdChat: wdChat,
                                            "eventType": "UPDATED",
                                            "changes": {
                                                "ordering": wdChats.indexOf(wdChat) !== indexBefore,
                                                "contactInfos": true,
                                                "unreadMessageCount": false
                                            }
                                        });
                                        return [3 /*break*/, 12];
                                    case 6:
                                        {
                                            params_4 = evtData.params;
                                            wdChat = wdChats.find(function (_a) {
                                                var ref = _a.ref;
                                                return ref === params_4.chatRef;
                                            });
                                            if (!wdChat) {
                                                return [2 /*return*/];
                                            }
                                            wdChats.splice(wdChats.indexOf(wdChat), 1);
                                            out.evtWdChat.post({ wdChat: wdChat, "eventType": "DELETED" });
                                        }
                                        return [3 /*break*/, 12];
                                    case 7:
                                        params_5 = evtData.params;
                                        indexBefore = wdChats.findIndex(function (_a) {
                                            var ref = _a.ref;
                                            return ref === params_5.chatRef;
                                        });
                                        if (indexBefore < 0) {
                                            return [2 /*return*/];
                                        }
                                        wdChat = wdChats[indexBefore];
                                        return [4 /*yield*/, decryptMessage({
                                                "decryptor": encryptorDecryptor,
                                                "encryptedMessage": params_5.message
                                            })];
                                    case 8:
                                        wdMessage_2 = _f.sent();
                                        if (!!wdChat.messages.find(function (_a) {
                                            var ref = _a.ref;
                                            return ref === wdMessage_2.ref;
                                        })) {
                                            return [2 /*return*/];
                                        }
                                        wdChat.messages.push(wdMessage_2);
                                        wdChat.messages.sort(types.wd.Message.compare);
                                        wdChats.sort(types.wd.Chat.compare);
                                        out.evtWdChat.post({
                                            wdChat: wdChat,
                                            "eventType": "UPDATED",
                                            "changes": {
                                                "ordering": wdChats.indexOf(wdChat) !== indexBefore,
                                                "unreadMessageCount": wdMessage_2.direction === "INCOMING",
                                                "contactInfos": false
                                            }
                                        });
                                        out.evtWdMessage.post({
                                            wdChat: wdChat,
                                            wdMessage: wdMessage_2,
                                            "eventType": "NEW"
                                        });
                                        return [3 /*break*/, 12];
                                    case 9:
                                        {
                                            params_6 = evtData.params;
                                            wdChatIndexBefore = wdChats.findIndex(function (_a) {
                                                var ref = _a.ref;
                                                return ref === params_6.chatRef;
                                            });
                                            if (wdChatIndexBefore < 0) {
                                                return [2 /*return*/];
                                            }
                                            wdChat = wdChats[wdChatIndexBefore];
                                            wdMessage = wdChat.messages
                                                .find(function (wdMessage) { return (wdMessage.ref === params_6.messageRef &&
                                                wdMessage.direction === "OUTGOING" &&
                                                wdMessage.status === "PENDING"); });
                                            if (wdMessage === undefined) {
                                                return [2 /*return*/];
                                            }
                                            createObjectWithGivenRef_1.createObjectWithGivenRef(wdMessage, {
                                                "ref": params_6.messageRef,
                                                "time": wdMessage.time,
                                                "direction": "OUTGOING",
                                                "text": wdMessage.text,
                                                "status": "SEND REPORT RECEIVED",
                                                "isSentSuccessfully": params_6.isSentSuccessfully
                                            });
                                            wdMessageIndexBefore = wdChat.messages.indexOf(wdMessage);
                                            wdChat.messages.sort(types.wd.Message.compare);
                                            wdChats.sort(types.wd.Chat.compare);
                                            out.evtWdChat.post({
                                                wdChat: wdChat,
                                                "eventType": "UPDATED",
                                                "changes": {
                                                    "ordering": wdChats.indexOf(wdChat) !== wdChatIndexBefore,
                                                    "unreadMessageCount": false,
                                                    "contactInfos": false
                                                }
                                            });
                                            out.evtWdMessage.post({
                                                wdChat: wdChat,
                                                wdMessage: wdMessage,
                                                "eventType": "UPDATED",
                                                "orderingChange": wdChat.messages.indexOf(wdMessage) !== wdMessageIndexBefore
                                            });
                                        }
                                        return [3 /*break*/, 12];
                                    case 10:
                                        params_7 = evtData.params;
                                        wdChatIndexBefore = wdChats.findIndex(function (_a) {
                                            var ref = _a.ref;
                                            return ref === params_7.chatRef;
                                        });
                                        if (wdChatIndexBefore < 0) {
                                            return [2 /*return*/];
                                        }
                                        wdChat = wdChats[wdChatIndexBefore];
                                        wdMessage_beforeUpdate_1 = wdChat.messages
                                            .find(function (wdMessage) { return (wdMessage.ref === params_7.messageRef &&
                                            wdMessage.direction === "OUTGOING" &&
                                            wdMessage.status === "SEND REPORT RECEIVED"); });
                                        if (wdMessage_beforeUpdate_1 === undefined) {
                                            return [2 /*return*/];
                                        }
                                        _d = createObjectWithGivenRef_1.createObjectWithGivenRef;
                                        _e = [wdMessage_beforeUpdate_1];
                                        return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                                                var part, sentBy, _a, _b, _c, _d, _e, _f, _g;
                                                return __generator(this, function (_h) {
                                                    switch (_h.label) {
                                                        case 0:
                                                            part = {
                                                                "ref": params_7.messageRef,
                                                                "time": wdMessage_beforeUpdate_1.time,
                                                                "direction": "OUTGOING",
                                                                "text": wdMessage_beforeUpdate_1.text,
                                                                "status": "STATUS REPORT RECEIVED",
                                                                "deliveredTime": params_7.deliveredTime
                                                            };
                                                            sentBy = params_7.sentBy;
                                                            if (!(sentBy.who === "USER")) return [3 /*break*/, 1];
                                                            _a = id_1.id(__assign(__assign({}, part), { sentBy: sentBy }));
                                                            return [3 /*break*/, 3];
                                                        case 1:
                                                            _b = id_1.id;
                                                            _c = [__assign({}, part)];
                                                            _d = {};
                                                            _e = "sentBy";
                                                            _f = {
                                                                "who": "OTHER"
                                                            };
                                                            _g = "email";
                                                            return [4 /*yield*/, decryptThenParse(sentBy.email.encrypted_string)];
                                                        case 2:
                                                            _a = _b.apply(void 0, [__assign.apply(void 0, _c.concat([(_d[_e] = (_f[_g] = _h.sent(),
                                                                        _f), _d)]))]);
                                                            _h.label = 3;
                                                        case 3: return [2 /*return*/, _a];
                                                    }
                                                });
                                            }); })()];
                                    case 11:
                                        wdMessage = _d.apply(void 0, _e.concat([_f.sent()]));
                                        wdMessageIndexBefore = wdChat.messages.indexOf(wdMessage);
                                        wdChat.messages.sort(types.wd.Message.compare);
                                        wdChats.sort(types.wd.Chat.compare);
                                        out.evtWdChat.post({
                                            wdChat: wdChat,
                                            "eventType": "UPDATED",
                                            "changes": {
                                                "ordering": wdChats.indexOf(wdChat) !== wdChatIndexBefore,
                                                "unreadMessageCount": wdMessage.sentBy.who === "OTHER",
                                                "contactInfos": false
                                            }
                                        });
                                        out.evtWdMessage.post({
                                            wdChat: wdChat,
                                            wdMessage: wdMessage,
                                            "eventType": "UPDATED",
                                            "orderingChange": wdChat.messages.indexOf(wdMessage) !== wdMessageIndexBefore
                                        });
                                        return [3 /*break*/, 12];
                                    case 12: return [2 /*return*/];
                                }
                            });
                        }); })()
                            .then(function () { var _a; return (_a = evtData.handlerCb) === null || _a === void 0 ? void 0 : _a.call(evtData); })
                            .catch(function (error) { var _a; return (_a = evtData.handlerCb) === null || _a === void 0 ? void 0 : _a.call(evtData, error); })];
                });
            }); });
            return out;
        };
    };
}
