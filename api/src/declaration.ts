import * as types from "./types";

export const domain = "semasim.com";
export const apiPath = "api";

export namespace registerUser {

    export const methodName = "register-user";

    export type Params = {
        email: string;
        password: string;
    };

    export type Response = "CREATED" | "EMAIL NOT AVAILABLE";

}

export namespace loginUser {

    export const methodName = "login-user";

    export type Params = {
        email: string;
        password: string;
    };

    /** isGranted */
    export type Response = boolean;

}

export namespace logoutUser {

    export const methodName = "logout-user";

    export type Params = undefined;

    export type Response = undefined;

}

export namespace sendRenewPasswordEmail {

    export const methodName = "send-renew-password-email";

    export type Params = {
        email: string;
    };

    /** true if email exist */
    export type Response = boolean;

}

export namespace getSims {

    export const methodName = "get-sim";

    export type Params = undefined;

    export type Response = types.UserSim[];

}

export namespace getUnregisteredLanDongles {

    export const methodName = "get-unregistered-lan-dongles";

    export type Params = undefined;

    export type Response = types.Dongle[];

}

export namespace unlockSim {

    export const methodName = "unlock-sim";

    export type Params = {
        imei: string;
        pin: string;
    };

    export type Response = types.UnlockResult;

}


export namespace registerSim {

    export const methodName = "register-sim";

    export type Params = {
        imsi: string;
        friendlyName: string;
    };

    export type Response = undefined;

}

export namespace unregisterSim {

    export const methodName = "unregister-sim";

    export type Params = {
        imsi: string;
    };

    export type Response = undefined;

}

export namespace shareSim {

    export const methodName = "share-sim";

    export type Params = {
        imsi: string;
        emails: string[];
        message: string;
    };

    export type Response = types.AffectedUsers;

}

export namespace stopSharingSim {

    export const methodName = "stop-sharing-sim";

    export type Params = {
        imsi: string;
        emails: string[];
    };

    export type Response = undefined;

}

/** Used for accepting sharing request or changing name */
export namespace setSimFriendlyName {

    export const methodName = "set-sim-friendly-name";

    export type Params = {
        imsi: string;
        friendlyName: string;
    };

    export type Response = undefined;

}

export namespace getUaConfig {

    //TODO: change after client updated
    export const methodName = "get-user-linphone-config";

    export type Params = {
        email_as_hex: string;
        password_as_hex: string;
    };

    export type Response = string;

}


export namespace webphoneData {

    export namespace fetch {

        export const methodName = "webphone-data_fetch";

        export type Params = undefined;

        export type Response = types.WebphoneData;

    }

    export namespace newInstance {

        export const methodName = "webphone-data_new-instance"

        export type Params = { imsi: string; };

        export type Response = types.WebphoneData.Instance;

    }

    export namespace newChat {

        export const methodName = "webphone-data_new-chat";

        export type Params = {
            instance_id: number;
            contactNumber: string;
            contactName: string;
            isContactInSim: boolean;
        };

        export type Response = types.WebphoneData.Chat;

    }

    export namespace updateChat {

        export const methodName = "webphone-data_update-chat";

        export type Params = {
            chat_id: number;
            lastSeenTime?: number;
            contactName?: string;
            isContactInSim?: boolean;
        };

        export type Response = undefined;

    }

    export namespace destroyChat {

        export const methodName = "webphone-data_destroy-chat";

        export type Params = {
            chat_id: number;
        };

        export type Response = undefined;

    }

    export namespace newMessage {

        export const methodName = "webphone-data_new-message";

        export type Params = {
            chat_id: number;
            message: types.WebphoneData.Message
        };

        export type Response = types.WebphoneData.Message;

    }

    export namespace updateOutgoingMessageStatus {

        export const methodName = "webphone-data_update-outgoing-message-status";

        export type Params = {
            message_id: number;
            status: types.WebphoneData.Message.Outgoing["status"]
        };

        export type Response = undefined;

    }


}

