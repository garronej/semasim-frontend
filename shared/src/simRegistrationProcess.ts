import { apiClient as api, types } from "../../api";
import * as tools from "../../tools";

const bootbox: any = window["bootbox"];

export async function start(): Promise<void> {

    let stopLoad = tools.loadingDialog("Looking for registerable SIM on LAN...");

    let unregisteredLanDongles = await api.getUnregisteredLanDongles();

    stopLoad();

    for (let dongle of await unregisteredLanDongles) {

        await interact(dongle);

    }

}

export async function interact(dongle: types.Dongle) {

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
        resolve => bootbox.dialog({
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

    if (!shouldAdd) return undefined;

    if (types.LockedDongle.match(dongle)) {

        let unlockResultValidPin: types.UnlockResult.ValidPin;

        while (true) {

            if (dongle.sim.pinState !== "SIM PIN") {

                bootbox.alert(`${dongle.sim.pinState} require manual unlock`);

                return undefined;

            }

            let tryLeft = dongle.sim.tryLeft;

            let pin = await new Promise<string>(
                resolve => bootbox.prompt({
                    "title": `PIN code? (${tryLeft} tries left)`,
                    "inputType": "number",
                    "callback": result => resolve(result)
                })
            );

            if (pin === null) return undefined;

            if (!pin.match(/^[0-9]{4}$/)) {

                let shouldContinue = await new Promise<boolean>(
                    resolve => bootbox.confirm({
                        "title": "PIN malformed!",
                        "message": "A pin code is composed of 4 digits, e.g. 0000",
                        callback: result => resolve(result)
                    })
                );

                if (!shouldContinue) return undefined;

                continue;

            }

            let stopLoad = tools.loadingDialog("Your sim is being unlocked please wait...", 0);

            let unlockResult = await api.unlockSim(dongle.imei, pin);

            stopLoad();

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

                bootbox.alert([
                    "Unlock success. You already have registered this SIM,",
                    " it just needed to be unlock again"
                ].join(""));

            } else {

                bootbox.alert([
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
            resolve => bootbox.alert(
                [
                    "Bad luck :(",
                    `Voice is ${sure ? "" : "( maybe )"} not enabled on the 3G Key you are using with this SIM.`,
                    `As as a result you ${sure ? "will" : "may"} not be able to place phones calls ${sure ? "(try and see for yourself)" : ""}.`,
                    "Chances are voice can be enabled on your HUAWEI dongle with dc-unlocker",
                    "Go to www.dc-unlocker.com and download dc-unlocker client (windows)",
                    "Connect your 3G key to your PC and try to get dc-unlocker to detect it",
                    "once your manage to get your dongle detected by the software go to",
                    "unlocking -> Activate Voice",
                    "They will make you pay 4€ to process...",
                    "We are currently trying to implement this ourself so you dont have to pay",
                    "for that but so far this is the only option.",
                    "",
                    `Dongle IMEI: ${dongle.imei}`
                ].join("<br>"),
                () => resolve()
            )
        );

    }

    let stopLoad = tools.loadingDialog("Please wait...");

    let friendlyName = await getDefaultFriendlyName();

    stopLoad();

    let friendlyNameSubmitted = await new Promise<string | null>(
        resolve => bootbox.prompt({
            "title": "Friendly name for this sim?",
            "value": friendlyName,
            "callback": result => resolve(result),
        })
    );

    if (friendlyNameSubmitted) {
        friendlyName = friendlyNameSubmitted;
    }


    stopLoad = tools.loadingDialog("Registering SIM...");

    await api.registerSim(dongle.sim.imsi, friendlyName);

    stopLoad();

}

async function getDefaultFriendlyName() {

    let build = i => `SIM ${i}`;

    let i = 1;

    let usableUserSims = (await api.getUserSims()).filter(
        userSim => types.UserSim.Usable.match(userSim)
    );

    while (
        usableUserSims.filter(
            ({ friendlyName }) => friendlyName === build(i)
        ).length
    ) {
        i++;
    }

    return build(i);

}
