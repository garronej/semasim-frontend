"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApi = exports.provideCustomImplementationOfApi = void 0;
var createGenericProxyForBootstrapModal_1 = require("./createGenericProxyForBootstrapModal");
//NOTE: Assert jQuery bootstrap on the page ( if use via web )
var customImplementationOfApi = undefined;
function provideCustomImplementationOfApi(api) {
    customImplementationOfApi = api;
}
exports.provideCustomImplementationOfApi = provideCustomImplementationOfApi;
var bootstrapBasedImplementationOfApi = {
    "create": function ($uninitializedModalDiv, options) {
        $uninitializedModalDiv.modal(options);
        return createGenericProxyForBootstrapModal_1.createGenericProxyForBootstrapModal($uninitializedModalDiv);
    }
};
exports.getApi = function () { return customImplementationOfApi || bootstrapBasedImplementationOfApi; };
