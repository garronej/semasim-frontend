import * as dcTypes from "chan-dongle-extended-client/dist/lib/types";

import { Evt, VoidEvt, UnpackEvt, ToNonPostableEvt, ToPostableEvt, SwapEvtType, NonPostableEvt } from "evt";
import { id } from "../../tools/typeSafety/id";
import { assert } from "../../tools/typeSafety/assert";
import { typeGuard } from "../../tools/typeSafety/typeGuard";
import { objectKeys } from "../../tools/typeSafety/objectKeys";
import { exclude } from "../../tools/typeSafety/exclude";

export type UserSim = UserSim.Shared | UserSim.Owned;

export namespace UserSim {

    export type Common_ = {
        sim: dcTypes.Sim;
        friendlyName: string;
        password: string;
        towardSimEncryptKeyStr: string;
        dongle: {
            imei: string;
            isVoiceEnabled?: boolean;
            manufacturer: string;
            model: string;
            firmwareVersion: string;
        };
        gatewayLocation: GatewayLocation;
        phonebook: Contact[];
        reachableSimState: ReachableSimState | undefined;
    };

    export type Owned = Common_ & { ownership: Ownership.Owned; };

    export namespace Owned {
        export function match(userSim: UserSim): userSim is Owned {
            return userSim.ownership.status === "OWNED";
        }
    }

    export type Shared = Shared.Confirmed | Shared.NotConfirmed;

    export namespace Shared {

        export type Confirmed = Common_ & {
            ownership: Ownership.Shared.Confirmed;
        };

        export namespace Confirmed {
            export function match(userSim: UserSim): userSim is Confirmed {
                return userSim.ownership.status === "SHARED CONFIRMED";
            }
        }

        export type NotConfirmed = Common_ & {
            ownership: Ownership.Shared.NotConfirmed;
        };

        export namespace NotConfirmed {
            export function match(userSim: UserSim): userSim is NotConfirmed {
                return userSim.ownership.status === "SHARED NOT CONFIRMED";
            }
        }

        export function match(userSim: UserSim): userSim is Shared {
            return Confirmed.match(userSim) || NotConfirmed.match(userSim);
        }

    }

    export type Ownership = Ownership.Owned | Ownership.Shared;

    export namespace Ownership {

        export type Owned = {
            status: "OWNED";
            sharedWith: {
                confirmed: string[];
                notConfirmed: string[];
            };
        };

        export type Shared = Shared.Confirmed | Shared.NotConfirmed;

        export namespace Shared {

            export type Confirmed = {
                status: "SHARED CONFIRMED";
                ownerEmail: string;
                otherUserEmails: string[];
            };

            export type NotConfirmed = {
                status: "SHARED NOT CONFIRMED";
                ownerEmail: string;
                otherUserEmails: string[];
                sharingRequestMessage: string | undefined;
            };

        }

    }

    export type ReachableSimState = {
        cellSignalStrength: dcTypes.Dongle.Usable.CellSignalStrength;
        isGsmConnectivityOk: boolean;
        ongoingCall: OngoingCall | undefined;
    };

    export type OngoingCall = {
        ongoingCallId: string;
        from: "DONGLE" | "SIP";
        number: string;
        isUserInCall: boolean;
        otherUserInCallEmails: string[];
    };

    export type Contact = {
        mem_index?: number;
        name: string;
        number_raw: string;
    };

    export type GatewayLocation = {
        ip: string;
        countryIso: string | undefined;
        subdivisions: string | undefined;
        city: string | undefined;
    };

    export function match(o: any): o is UserSim {
        return (
            typeGuard<UserSim>(o) &&
            !!o &&
            o instanceof Object &&
            o.sim instanceof Object &&
            typeof o.friendlyName === "string" &&
            typeof o.password === "string" &&
            typeof o.towardSimEncryptKeyStr === "string" &&
            o.dongle instanceof Object &&
            o.gatewayLocation instanceof Object &&
            o.ownership instanceof Object &&
            o.phonebook instanceof Array &&
            (
                o.reachableSimState === undefined ||
                o.reachableSimState instanceof Object
            )
        );
    }


    export type Evts = ToNonPostableEvt<{
        evtNew: Evt<{
            cause: "SIM REGISTERED FROM LAN";
            userSim: UserSim.Owned;
        } | {
            cause: "SHARING REQUEST RECEIVED";
            userSim: UserSim.Shared.NotConfirmed;
        }>;
        evtNowConfirmed: Evt<UserSim.Shared.Confirmed>;
        evtDelete: Evt<{
            cause: "USER UNREGISTER SIM";
            userSim: UserSim.Usable;
        } | {
            cause: "PERMISSION LOSS";
            userSim: UserSim.Shared;
        } | {
            cause: "REJECT SHARING REQUEST";
            userSim: UserSim.Shared.NotConfirmed;
        }>;
        evtReachabilityStatusChange: Evt<UserSim>;
        evtSipPasswordRenewed: Evt<UserSim>;
        evtCellularConnectivityChange: Evt<UserSim>;
        evtCellularSignalStrengthChange: Evt<UserSim>;
        evtOngoingCall: Evt<UserSim>;
        evtNewUpdatedOrDeletedContact: Evt<{
            eventType: "NEW" | "UPDATED" | "DELETED"
            userSim: UserSim;
            contact: Contact;
        }>,
        evtSharedUserSetChange: Evt<{
            userSim: UserSim;
            action: "ADD" | "REMOVE" | "MOVE TO CONFIRMED";
            targetSet: "CONFIRMED USERS" | "NOT CONFIRMED USERS";
            email: string;
        }>;
        evtFriendlyNameChange: Evt<UserSim.Usable>;
    }>;

    export namespace Evts {

        export type ForSpecificSim = {
            [key in Exclude<keyof Evts, "evtNew">]: SwapEvtType<
                Evts[key],
                RemoveUserSim<UnpackEvt<Evts[key]>>
            >;
        };

        export namespace ForSpecificSim {

            const buildForSpecificSim = buildEvtsForSpecificSimFactory({
                "createNewInstance": () => ({
                    "evtNowConfirmed": Evt.create(),
                    "evtDelete": new Evt(),
                    "evtReachabilityStatusChange": Evt.create(),
                    "evtSipPasswordRenewed": Evt.create(),
                    "evtCellularConnectivityChange": Evt.create(),
                    "evtCellularSignalStrengthChange": Evt.create(),
                    "evtOngoingCall": Evt.create(),
                    "evtNewUpdatedOrDeletedContact": new Evt(),
                    "evtSharedUserSetChange": new Evt(),
                    "evtFriendlyNameChange": Evt.create()
                })
            });

            export function build(
                userSimEvts: Evts,
                userSim: UserSim
            ): ForSpecificSim;
            export function build<Keys extends keyof ForSpecificSim>(
                userSimEvts: Pick<Evts, Keys>,
                userSim: UserSim,
                keys: Keys[]
            ): Pick<ForSpecificSim, Keys>;
            export function build<Keys extends keyof ForSpecificSim>(
                userSimEvts: Pick<Evts, Keys>,
                userSim: UserSim,
                keys?: Keys[]
            ): Pick<ForSpecificSim, Keys> {
                return buildForSpecificSim(userSimEvts, userSim, keys);
            }

        }

    }

    export type Usable = Owned | Shared.Confirmed;;

    export namespace Usable {

        export function match(userSim: UserSim): userSim is Usable {
            return Owned.match(userSim) || Shared.Confirmed.match(userSim);
        }

        /** The events that apply to an array of usable sim 
         * are all usable ( the sim shared not included ).
         * 
         * All events are the same except evtNowConfirmed
         * and evtNew that are changed. 
         * 
         * When a sim goes from state shared not confirmed
         * to shared confirmed it is added to the array
         * so an evtNew is posted.
         * 
         * Also all UserSim are here UserSim.Usable.
         * 
         */
        export type Evts = {
            [key in Exclude<keyof UserSim.Evts, "evtNowConfirmed" | "evtNew" | "evtDelete">]:
            SwapEvtType<UserSim.Evts[key], ReplaceByUsable<UnpackEvt<UserSim.Evts[key]>>>
        } & {
            evtNew: NonPostableEvt<
                Exclude<
                    UnpackEvt<UserSim.Evts["evtNew"]>,
                    { cause: "SHARING REQUEST RECEIVED" }
                > | {
                    cause: "SHARED SIM CONFIRMED";
                    userSim: UserSim.Shared.Confirmed;
                }
            >;
            evtDelete: NonPostableEvt<
                Exclude<
                    UnpackEvt<UserSim.Evts["evtDelete"]>,
                    { cause: "REJECT SHARING REQUEST" | "PERMISSION LOSS"; }
                > | {
                    cause: "PERMISSION LOSS";
                    userSim: UserSim.Shared.Confirmed;
                }
            >;
        };

        export namespace Evts {

            export function build(params: {
                userSims: UserSim[];
                userSimEvts: UserSim.Evts;
            }): {
                userSims: UserSim.Usable[];
                userSimEvts: Evts;
            } {

                const userSims = params.userSims.filter(Usable.match);

                const userSimEvts: ToPostableEvt<Evts> = {
                    "evtNew": Evt.merge([
                        params.userSimEvts.evtNew
                            .pipe(data => data.cause === "SHARING REQUEST RECEIVED" ? null : [data]),
                        params.userSimEvts.evtNowConfirmed
                            .pipe(userSim => [{ "cause": "SHARED SIM CONFIRMED" as const, userSim }])
                    ]).pipe(({ userSim }) => { userSims.push(userSim); return true; }),
                    "evtDelete": new Evt(),
                    "evtReachabilityStatusChange": new Evt(),
                    "evtSipPasswordRenewed": new Evt(),
                    "evtCellularConnectivityChange": new Evt(),
                    "evtCellularSignalStrengthChange": new Evt(),
                    "evtOngoingCall": new Evt(),
                    "evtNewUpdatedOrDeletedContact": new Evt(),
                    "evtSharedUserSetChange": new Evt(),
                    "evtFriendlyNameChange": new Evt()
                };

                objectKeys(userSimEvts)
                    .filter(exclude("evtNew"))
                    .forEach(eventName =>
                        Evt.factorize(params.userSimEvts[eventName])
                            .attach(
                                eventData => Usable.match(
                                    "userSim" in eventData ?
                                        eventData.userSim : eventData
                                ),
                                eventData => Evt.factorize(userSimEvts[eventName])
                                    .post(eventData as any)
                            )
                    )
                    ;

                userSimEvts.evtDelete = userSimEvts.evtDelete
                    .pipe(({ userSim }) => { userSims.splice(userSims.indexOf(userSim), 1); return true })
                    ;

                return { userSims, userSimEvts };

            }

            export type ForSpecificSim = {
                [key in Exclude<keyof Evts, "evtNew">]: SwapEvtType<
                    Evts[key],
                    RemoveUserSim<UnpackEvt<Evts[key]>>
                >;
            };

            export namespace ForSpecificSim {

                /** NOTE: Hack on the types here to avoid copy pasting */
                const buildForSpecificSim = buildEvtsForSpecificSimFactory({
                    "createNewInstance": () => id<ForSpecificSim>({
                        "evtDelete": new Evt(),
                        "evtReachabilityStatusChange": Evt.create(),
                        "evtSipPasswordRenewed": Evt.create(),
                        "evtCellularConnectivityChange": Evt.create(),
                        "evtCellularSignalStrengthChange": Evt.create(),
                        "evtOngoingCall": Evt.create(),
                        "evtNewUpdatedOrDeletedContact": new Evt(),
                        "evtSharedUserSetChange": new Evt(),
                        "evtFriendlyNameChange": Evt.create()
                    }) as ToPostableEvt<UserSim.Evts.ForSpecificSim>
                }) as any;

                export function build(
                    userSimEvts: Evts,
                    userSim: UserSim.Usable
                ): ForSpecificSim;
                export function build<Keys extends keyof ForSpecificSim>(
                    userSimEvts: Pick<Evts, Keys>,
                    userSim: UserSim.Usable,
                    keys: Keys[]
                ): Pick<ForSpecificSim, Keys>;
                export function build<Keys extends keyof ForSpecificSim>(
                    userSimEvts: Pick<Evts, Keys>,
                    userSim: UserSim.Usable,
                    keys?: Keys[]
                ): Pick<ForSpecificSim, Keys> {

                    return buildForSpecificSim(userSimEvts, userSim, keys);

                }


            }

        };





    }



}




type UserSim_ = UserSim;
type Evts_ = UserSim.Evts;
type EvtsForSpecificSim_ = UserSim.Evts.ForSpecificSim;

//NOTE: Should work as well with the types restricted to usable userSim ( we avoid copy past )
//type UserSim_= UserSim.Usable;
//type Evts_ = UserSim.Usable.Evts;
//type EvtsForSpecificSim_ = UserSim.Usable.Evts.ForSpecificSim;

function buildEvtsForSpecificSimFactory(
    params: { createNewInstance: () => ToPostableEvt<EvtsForSpecificSim_>; }
) {

    const { createNewInstance } = params;

    return function buildForSpecificSim<Keys extends keyof EvtsForSpecificSim_>(
        userSimEvts: Pick<Evts_, Keys>,
        userSim: UserSim_,
        keys?: Keys[]
    ): Pick<EvtsForSpecificSim_, Keys> {

        const out = (() => {

            const out = createNewInstance();


            if (keys === undefined) {
                return out;
            }

            objectKeys(out)
                .filter(eventName => id<string[]>(keys).indexOf(eventName) < 0)
                .forEach(eventName => delete out[eventName])
                ;

            return out as Pick<ReturnType<typeof createNewInstance>, Keys>;

        })();

        objectKeys(out).forEach(eventName => {

            const evt = Evt.factorize(out[eventName]);

            Evt.factorize(userSimEvts[eventName]).attach(
                data => {

                    if (UserSim.match(data)) {

                        if (data !== userSim) {
                            return;
                        }

                        assert(typeGuard<VoidEvt>(evt));

                        evt.post();

                        return;

                    } else {


                        const { userSim: userSim_, ...rest } = id<Object>(data) as any;

                        assert(UserSim.match(userSim_));

                        if (userSim_ !== userSim) {
                            return;
                        }

                        evt.post(rest);

                    }

                }
            );






        });

        return out;

    }

}



//NOTE: Just to validate when we switch types to Usable
(() => {

    const buildForSpecificSim: ReturnType<typeof buildEvtsForSpecificSimFactory> = null as any;

    function build(
        userSimEvts: Evts_,
        userSim: UserSim_
    ): EvtsForSpecificSim_;
    function build<Keys extends keyof EvtsForSpecificSim_>(
        userSimEvts: Pick<Evts_, Keys>,
        userSim: UserSim_,
        keys: Keys[]
    ): Pick<EvtsForSpecificSim_, Keys>;
    function build<Keys extends keyof EvtsForSpecificSim_>(
        userSimEvts: Pick<Evts_, Keys>,
        userSim: UserSim_,
        keys?: Keys[]
    ): Pick<EvtsForSpecificSim_, Keys> {
        return buildForSpecificSim(userSimEvts, userSim, keys);
    }

    build;


})();



/** 
 * Think of is as: 
 * 
 * type RemoveUserSim<T> =
 *    T extends UserSim ? void :
 *    T extends { userSim: UserSim } ? Omit<T, "userSim"> :
 *    T
 *    ;
 * 
*/
type RemoveUserSim<T> =
    T extends UserSim ? void
    :
    (
        T extends UnpackEvt<UserSim.Evts["evtNew"]> ?
        { cause: UnpackEvt<UserSim.Evts["evtNew"]>["cause"]; }
        :
        (
            T extends UnpackEvt<UserSim.Evts["evtDelete"]> ?
            { cause: UnpackEvt<UserSim.Evts["evtDelete"]>["cause"]; }
            :
            (
                T extends { userSim: UserSim } ?
                Omit<T, "userSim">
                :
                T
            )
        )
    )
    ;

export type ReplaceByUsable<T> =
    T extends UserSim ? UserSim.Usable :
    (
        T extends { userSim: UserSim; } ?
        Omit<T, "userSim"> & { userSim: UserSim.Usable; }
        :
        T
    )
    ;

