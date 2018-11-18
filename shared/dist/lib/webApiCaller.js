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
Object.defineProperty(exports, "__esModule", { value: true });
var apiDeclaration = require("../web_api_declaration");
var ttJC = require("transfer-tools/dist/lib/JSON_CUSTOM");
//NOTE: Assert jQuery loaded on the page
var JSON_CUSTOM = ttJC.get();
function sendRequest(methodName, params) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) { return window["$"].ajax({
                    "url": "/" + apiDeclaration.apiPath + "/" + methodName,
                    "method": "POST",
                    "contentType": "application/json; charset=UTF-8",
                    "data": JSON_CUSTOM.stringify(params),
                    "dataType": "text",
                    "statusCode": {
                        "400": function () { return alert("Bad request ( bug in the client )"); },
                        "401": function () { return window.location.reload(); },
                        "500": function () { return alert("Bug on the server, sorry :("); },
                        "200": function (data) { return resolve(JSON_CUSTOM.parse(data)); }
                    }
                }); })];
        });
    });
}
function registerUser(email, password) {
    var methodName = apiDeclaration.registerUser.methodName;
    return sendRequest(methodName, { email: email, password: password });
}
exports.registerUser = registerUser;
function validateEmail(email, activationCode) {
    var methodName = apiDeclaration.validateEmail.methodName;
    return sendRequest(methodName, { email: email, activationCode: activationCode });
}
exports.validateEmail = validateEmail;
function loginUser(email, password) {
    var methodName = apiDeclaration.loginUser.methodName;
    return sendRequest(methodName, { email: email, password: password });
}
exports.loginUser = loginUser;
function logoutUser() {
    var methodName = apiDeclaration.logoutUser.methodName;
    return sendRequest(methodName, undefined);
}
exports.logoutUser = logoutUser;
/** Return true if email has account */
function sendRenewPasswordEmail(email) {
    var methodName = apiDeclaration.sendRenewPasswordEmail.methodName;
    return sendRequest(methodName, { email: email });
}
exports.sendRenewPasswordEmail = sendRenewPasswordEmail;
function renewPassword(email, newPassword, token) {
    var methodName = apiDeclaration.renewPassword.methodName;
    return sendRequest(methodName, { email: email, newPassword: newPassword, token: token });
}
exports.renewPassword = renewPassword;
/*
function buildUrl(
    methodName: string,
    params: Record<string, string | undefined>
): string {

    let query: string[] = [];

    for (let key of Object.keys(params)) {

        let value = params[key];

        if (value === undefined) continue;

        query[query.length] = `${key}=${params[key]}`;

    }

    let url = `https://${c.backendHostname}:${c.webApiPort}/${c.webApiPath}/${methodName}?${query.join("&")}`;

    console.log(`GET ${url}`);

    return url;
}
*/ 