"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApi = exports.provideCustomImplementationOfApi = void 0;
var createGenericProxyForBootstrapModal_1 = require("../createGenericProxyForBootstrapModal");
var customImplementationOfApi = undefined;
function provideCustomImplementationOfApi(api) {
    customImplementationOfApi = api;
}
exports.provideCustomImplementationOfApi = provideCustomImplementationOfApi;
var bootboxBasedImplementationOfBaseApi = {
    "create": function (dialogType, options) {
        var bootstrapModal = bootbox[dialogType](options);
        return createGenericProxyForBootstrapModal_1.createGenericProxyForBootstrapModal(bootstrapModal);
    },
    "createLoading": function (message) { return bootboxBasedImplementationOfBaseApi.create("dialog", {
        "message": [
            '<p class="text-center">',
            '<i class="fa fa-spin fa-spinner"></i>&nbsp;&nbsp;',
            "<span class=\"" + loading.spanClass + "\">" + message + "</span>",
            "</p>"
        ].join(""),
        "closeButton": false,
        "onEscape": false,
        "animate": false,
        "show": false
    }); }
};
//TODO: See if needed.
var loading;
(function (loading) {
    loading.spanClass = "loading_message";
})(loading || (loading = {}));
exports.getApi = function () { return customImplementationOfApi || bootboxBasedImplementationOfBaseApi; };
