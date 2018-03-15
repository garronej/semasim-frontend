import { SyncEvent, VoidSyncEvent} from "ts-events-extended";
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

                        let sipPacketAsString = Buffer.from(ev.data).toString("utf8");

                        let imsi = sipPacketAsString.match(
                            !!sipPacketAsString.match(/^SIP/) ?
                                /\r\nFrom:[^:]+:([0-9]{15})@/ :
                                /\r\nTo:[^:]+:([0-9]{15})@/
                        )[1]!

                        //console.log( window["JsSIP.Parser"].parseMessage(str, {}));

                        console.log(sipPacketAsString);

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

        console.log(data);

        return this.jsSipWebsocket.send(data);
    }

    public connect(): void {
        return this.jsSipWebsocket.connect();
    }

    public disconnect(): void {
        return this.jsSipWebsocket.disconnect();
    }

    public makeProxy(imsi: string) {

        let proxy = Object.defineProperties(
            {
                "connect": async () => {

                    if (this.isConnected()) {
                        proxy.onconnect();
                    }

                },
                "disconnect": () => { throw new Error("JsSip should never ask to disconnect") },
                "send": data => this.send(data)
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

        return proxy;

    }

}