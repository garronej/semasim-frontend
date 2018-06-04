import { apiClient as api, types } from "../../api";
import * as dcTypes from "../node_modules/chan-dongle-extended-client/dist/lib/types";
import * as tools from "../../tools";

export async function start(): Promise<void> {

    tools.bootbox_custom.loading("Looking for registerable SIM on your LAN..");

    for (let dongle of await api.getUnregisteredLanDongles() ) {

        await interact(dongle);

    }

    tools.bootbox_custom.dismissLoading();

}

async function interact(dongle: dcTypes.Dongle) {

    let shouldAdd_message = (() => {

        let arr = [
            `SIM inside:`,
            `${dongle.manufacturer} ${dongle.model}`,
            `IMEI: ${dongle.imei}`,
        ];

        if (dongle.sim.iccid) {

            arr = [
                ...arr,
                "",
                "SIM ICCID (number printed on SIM): ",
                dongle.sim.iccid
            ];

        }

        return arr.join("<br>");

    })();

    let shouldAdd = await new Promise<boolean>(
        resolve => tools.bootbox_custom.dialog({
            "title": "SIM ready to be registered",
            "message": `<p class="text-center">${shouldAdd_message}</p>`,
            "buttons": {
                "cancel": {
                    "label": "Not now",
                    "callback": () => resolve(false)
                },
                "success": {
                    "label": "Yes, register this sim",
                    "className": "btn-success",
                    "callback": () => resolve(true)
                }
            },
            "closeButton": false
        })
    );

    if (!shouldAdd){ 
        return undefined;
    }

    if (dcTypes.Dongle.Locked.match(dongle)) {

        let unlockResultValidPin: types.UnlockResult.ValidPin;

        while (true) {

            if (dongle.sim.pinState !== "SIM PIN") {

                tools.bootbox_custom.alert(`${dongle.sim.pinState} require manual unlock`);

                return undefined;

            }

            let tryLeft = dongle.sim.tryLeft;

            let pin = await new Promise<string>(
                resolve => tools.bootbox_custom.prompt({
                    "title": `PIN code? (${tryLeft} tries left)`,
                    "inputType": "number",
                    "callback": result => resolve(result)
                })
            );

            if (pin === null){ 
                return undefined;
            }

            if (!pin.match(/^[0-9]{4}$/)) {

                let shouldContinue = await new Promise<boolean>(
                    resolve => tools.bootbox_custom.confirm({
                        "title": "PIN malformed!",
                        "message": "A pin code is composed of 4 digits, e.g. 0000",
                        callback: result => resolve(result)
                    })
                );

                if (!shouldContinue) return undefined;

                continue;

            }

            tools.bootbox_custom.loading("Your sim is being unlocked please wait...", 0);

            let unlockResult = await api.unlockSim(dongle.imei, pin);

            if (!unlockResult.wasPinValid) {

                dongle.sim.pinState = unlockResult.pinState;
                dongle.sim.tryLeft = unlockResult.tryLeft;

                continue;

            }

            unlockResultValidPin = unlockResult;

            break;

        }

        if (!unlockResultValidPin.isSimRegisterable) {

            if (unlockResultValidPin.simRegisteredBy.who === "MYSELF") {

                tools.bootbox_custom.alert([
                    "Unlock success. You already have registered this SIM,",
                    " it just needed to be unlock again"
                ].join(""));

            } else {

                tools.bootbox_custom.alert([
                    "Unlock success, the SIM is currently registered ",
                    `by account: ${unlockResultValidPin.simRegisteredBy.email}`
                ].join(""));

            }

            return undefined;

        }

        dongle = unlockResultValidPin.dongle;

    }

    if (dongle.isVoiceEnabled !== true) {

        let sure = dongle.isVoiceEnabled === false;

        await new Promise<void>(
            resolve => tools.bootbox_custom.alert(
                [
                    "Bad luck :(",
                    `Voice is ${sure ? "" : "( maybe )"} not enabled on the 3G Key you are using with this SIM.`,
                    `As as a result you ${sure ? "will" : "may"} not be able to place phones calls ${sure ? "(try and see for yourself)" : ""}.`,
                    "Chances are voice can be enabled on your HUAWEI dongle with dc-unlocker",
                    "Go to www.dc-unlocker.com and download dc-unlocker client (windows)",
                    "Connect your 3G key to your PC and try to get dc-unlocker to detect it",
                    "once your manage to get your dongle detected by the software go to",
                    "unlocking -> Activate Voice",
                    "They will charge you 4€ for it...",
                    "We are currently trying to implement this ourself so you dont have to pay",
                    "for that but so far this is the only option.",
                    "",
                    `Dongle IMEI: ${dongle.imei}`
                ].join("<br>"),
                () => resolve()
            )
        );

    }

    tools.bootbox_custom.loading("Suggesting a suitable friendly name ...");

    let friendlyName = await getDefaultFriendlyName(dongle.sim);

    let friendlyNameSubmitted = await new Promise<string | null>(
        resolve => tools.bootbox_custom.prompt({
            "title": "Friendly name for this sim?",
            "value": friendlyName,
            "callback": result => resolve(result),
        })
    );

    if (friendlyNameSubmitted) {
        friendlyName = friendlyNameSubmitted;
    }

    tools.bootbox_custom.loading("Registering SIM...");

    await api.registerSim(dongle.sim.imsi, friendlyName);

}

async function getDefaultFriendlyName(sim: dcTypes.Sim) {

    let tag = sim.serviceProvider.fromImsi || sim.serviceProvider.fromNetwork || "";

    let num= sim.storage.number;

    if( !tag && num && num.length > 6 ){

        tag = num.slice(0, 4) + ".." + num.slice(-2);

    }

    tag= tag || "X";

    let build = (i: number) => `SIM ${tag}${i === 0 ? "" : ` ( ${i} )`}`;

    let i = 0;

    let usableUserSims = (await api.getUserSims()).filter(
        userSim => types.UserSim.Usable.match(userSim)
    );

    while (
        usableUserSims.filter(
            ({ friendlyName, sim }) => friendlyName === build(i)
        ).length
    ) {
        i++;
    }

    return build(i);

}
