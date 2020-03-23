import { dialogApi, startMultiDialogProcess } from "../../tools/modal/dialog";
import { createModal } from "../../tools/modal";
import * as types from "../types";
export declare function managerPageLaunch(params: {
    assertJsRuntimeEnv: "browser";
}): {
    dialogApi: typeof dialogApi;
    startMultiDialogProcess: typeof startMultiDialogProcess;
    createModal: typeof createModal;
    prReadyToAuthenticateStep: Promise<{
        loginUser: import("../webApiCaller").WebApi["loginUser"];
        prAccountManagementApi: Promise<types.AccountManagementApi>;
    }>;
};
