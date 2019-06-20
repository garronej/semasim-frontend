

import * as types from "../types";

declare const Buffer: any;

export type AuthenticatedSessionDescriptorSharedData = types.AuthenticatedSessionDescriptorSharedData;

export namespace AuthenticatedSessionDescriptorSharedData {

    export function set(
        authenticatedSessionDescriptorSharedData: AuthenticatedSessionDescriptorSharedData,
        setter: (key: string, value: string) => void
    ): void {

        setter(
            types.cookieKeys.SessionData,
            Buffer.from(
                JSON.stringify(authenticatedSessionDescriptorSharedData),
                "utf8"
            ).toString("hex")
        );

    }

}

export type WebsocketConnectionParams = types.WebsocketConnectionParams;

export namespace WebsocketConnectionParams {

    /** Read from cookie */
    export function get(parsedCookies: { [key: string]: string; }): WebsocketConnectionParams | undefined {

        let out: WebsocketConnectionParams;

        try {
            out = JSON.parse(
                Buffer.from(
                    parsedCookies[types.cookieKeys.WebsocketConnectionParams],
                    "hex"
                ).toString("utf8")
            );
        } catch{
            return undefined;
        }

        if (
            !(
                out instanceof Object &&
                typeof out.requestTurnCred === "boolean" &&
                typeof out.connectionType === "string" &&
                (
                    out.connectionType === "MAIN" ||
                    out.connectionType === "AUXILIARY" &&
                    typeof out.uaInstanceId === "string" &&
                    /"<urn:uuid:[0-9a-f\-]{30,50}>"$/.test(out.uaInstanceId)
                )

            )
        ) {
            return undefined;
        }

        return out;

    }

}