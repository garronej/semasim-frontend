import { SyncEvent, VoidSyncEvent } from "ts-events-extended";
import { apiDeclaration } from "../../../api";

declare const Buffer: any;
declare const JsSIP: any;



export class AppSocket {

    private readonly jsSipWebsocket: any;

    public readonly evtConnected = new VoidSyncEvent();
    public readonly evtDisconnected = new SyncEvent<{ error: boolean; code: number; reason: string; }>();
    public readonly evtRawSipPacket = new SyncEvent<{ data: string; imsi: string; }>();
    public readonly evtBackendNotification = new SyncEvent<string>();

    constructor() {

        this.jsSipWebsocket = Object.defineProperties(
            new JsSIP.WebSocketInterface(
                `wss://www.${apiDeclaration.domain}`
            ), {
                "_onMessage": {
                    "value": (ev: MessageEvent) => {

                        const sipPacketAsString = Buffer.from(ev.data).toString("utf8");

                        const imsi = sipPacketAsString.match(
                            !!sipPacketAsString.match(/^SIP/) ?
                                /\r\nFrom:[^:]+:([0-9]{15})/ :
                                /\r\nTo:[^:]+:([0-9]{15})/
                        )[1]!

                        //console.log( window["JsSIP.Parser"].parseMessage(str, {}));

                        //console.log(sipPacketAsString);

                        this.evtRawSipPacket.post({ "data": sipPacketAsString, imsi });

                    }
                },
                "_onOpen": {
                    "value": () => this.evtConnected.post()
                },
                "_onClose": {
                    "value": (wasClean, code, reason) =>
                        this.evtDisconnected.post({ "error": !wasClean, code, reason })
                }

            }
        );

    }

    public get via_transport(): string {
        return this.jsSipWebsocket.via_transport;
    }

    public get url(): string {
        return this.jsSipWebsocket.url;
    }

    public get sip_uri(): string {
        return this.jsSipWebsocket.sip_uri;
    }

    public isConnected(): boolean {
        return this.jsSipWebsocket.isConnected();
    }

    public send(data: string): boolean {
        return this.jsSipWebsocket.send(data);
    }

    public connect(): void {
        return this.jsSipWebsocket.connect();
    }

    public disconnect(): void {
        return this.jsSipWebsocket.disconnect();
    }

    public makeProxy(imsi: string): {
        proxy: any;
        setMessageOkDelay: (request: any, pr: Promise<void>) => void;
    } {

        const messageOkDelays = new Map<string, Promise<void>>();

        const proxy = Object.defineProperties(
            {
                "connect": async () => {

                    if (this.isConnected()) {
                        proxy.onconnect();
                    }

                },
                "disconnect": () => { throw new Error("JsSip should never ask to disconnect") },
                "send": data => {

                    const call_id = getMessageOkCallId(data);

                    if (!call_id) {

                        return this.send(data);

                    } else {

                        const pr = messageOkDelays.get(call_id);

                        if (!pr) {

                            return this.send(data);

                        } else {

                            pr.then(() => this.send(data));

                            messageOkDelays.delete(call_id);

                            return true;

                        }


                    }

                }
            }, {
                "via_transport": {
                    "get": () => this.via_transport
                },
                "url": {
                    "get": () => this.url
                },
                "sip_uri": {
                    "get": () => this.sip_uri
                }
            }
        );

        this.evtRawSipPacket.attach(
            evt => evt.imsi === imsi,
            ({ data }) => proxy.ondata(data)
        );

        this.evtConnected.attach(
            () => proxy.onconnect()
        );

        this.evtDisconnected.attach(
            ({ error, code, reason }) => proxy.ondisconnect({
                "socket": proxy,
                error,
                code,
                reason
            })
        );

        return {
            proxy,
            "setMessageOkDelay": (request, pr) => messageOkDelays.set(
                request.getHeader("Call-ID"),
                pr
            )
        };

    }

}



/**
 * Return the call id of a SIP response OK to a MESSAGE 
 * sip request or return undefined if not applicable.
 */
function getMessageOkCallId(rawMessage: string): string | undefined {

    const split = rawMessage.split("\r\n");

    if (split.length === 0) {
        return undefined;
    }

    if (!split.shift()!.match(/^SIP\/2\.0\s+200\s+OK\s*$/)) {
        return undefined;
    }

    if (!split.find(line => !!line.match(/^CSeq:\s*[0-9]+\s+MESSAGE\s*$/))) {
        return undefined;
    }

    for (const line of split) {

        const match = line.match(/^Call-ID:\s*(.*)$/);

        if (!!match) {

            return match[1];

        }

    }

    return undefined;

}