"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var cryptoLib = require("./cryptoLibProxy");
var crypto = require("./keysGeneration");
var AuthenticatedSessionDescriptorSharedData_1 = require("../localStorage/AuthenticatedSessionDescriptorSharedData");
var TowardUserKeys_1 = require("../localStorage/TowardUserKeys");
var remoteApiCaller = require("../toBackend/remoteApiCaller");
var Ua_1 = require("../Ua");
/** When creating a new Ua instance an encryptor must be provided
 * so we expose the reference of the rsa thread */
var rsaWorkerThreadPoolId = cryptoLib.workerThreadPool.Id.generate();
/**
 * ASSERT: User logged.
 *
 * -Pre spawn the crypto workers ( aes and rsa )
 * -Provide an aes encryptor/decryptor to remoteApiCaller so that
 *  the webData api can be used.
 * -Statically provide a rsa decryptor to Ua class ( so that incoming
 * message can be decrypted ) */
function globalSetup() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, email, uaInstanceId, encryptedSymmetricKey, towardUserKeys, towardUserDecryptor, aesWorkerThreadPoolId, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, AuthenticatedSessionDescriptorSharedData_1.AuthenticatedSessionDescriptorSharedData.get()];
                case 1:
                    _a = _f.sent(), email = _a.email, uaInstanceId = _a.uaInstanceId, encryptedSymmetricKey = _a.encryptedSymmetricKey;
                    //NOTE: Only one thread as for rsa we need the encrypt function to be run exclusive.
                    cryptoLib.workerThreadPool.preSpawn(rsaWorkerThreadPoolId, 1);
                    return [4 /*yield*/, TowardUserKeys_1.TowardUserKeys.retrieve()];
                case 2:
                    towardUserKeys = _f.sent();
                    towardUserDecryptor = cryptoLib.rsa.decryptorFactory(towardUserKeys.decryptKey, rsaWorkerThreadPoolId);
                    aesWorkerThreadPoolId = cryptoLib.workerThreadPool.Id.generate();
                    cryptoLib.workerThreadPool.preSpawn(aesWorkerThreadPoolId, 3);
                    _c = (_b = remoteApiCaller).setWebDataEncryptorDescriptor;
                    _e = (_d = cryptoLib.aes).encryptorDecryptorFactory;
                    return [4 /*yield*/, crypto.symmetricKey.decryptKey(towardUserDecryptor, encryptedSymmetricKey)];
                case 3:
                    _c.apply(_b, [_e.apply(_d, [_f.sent(),
                            aesWorkerThreadPoolId])]);
                    Ua_1.Ua.session = {
                        email: email,
                        "instanceId": uaInstanceId,
                        "towardUserEncryptKeyStr": cryptoLib.RsaKey.stringify(towardUserKeys.encryptKey),
                        towardUserDecryptor: towardUserDecryptor
                    };
                    return [2 /*return*/];
            }
        });
    });
}
exports.globalSetup = globalSetup;
exports.getTowardSimEncryptor = function (userSim) {
    return cryptoLib.rsa.encryptorFactory(cryptoLib.RsaKey.parse(userSim.towardSimEncryptKeyStr), rsaWorkerThreadPoolId);
};