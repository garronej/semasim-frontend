import { apiClient as api, types } from "../../api";
import * as tools from "../../tools";

/** return need reedReload */
export async function start(
): Promise<types.UserSim.Usable[]> {

    tools.bootbox_custom.loading("Retrieving your SIMs please wait...");

    let userSims = await api.getUserSims();

    let usableUserSims = userSims.filter(
        userSim => types.UserSim.Usable.match(userSim)
    ) as types.UserSim.Usable[];

    let notConfirmedUserSims = userSims.filter(
        userSim => types.UserSim.Shared.NotConfirmed.match(userSim)
    ) as types.UserSim.Shared.NotConfirmed[];

    for (let notConfirmedUserSim of notConfirmedUserSims) {

        let friendlyNameBase = notConfirmedUserSim.friendlyName;
        let i = 0;

        while (
            usableUserSims.filter(
                ({ friendlyName }) => friendlyName === notConfirmedUserSim.friendlyName
            ).length
        ) {
            notConfirmedUserSim.friendlyName = `${friendlyNameBase} (${i++})`;
        }

        let confirmedUserSim = await interact(notConfirmedUserSim);

        if (confirmedUserSim) {
            usableUserSims.push(confirmedUserSim);
        }

    }

    tools.bootbox_custom.dismissLoading();

    return usableUserSims;

}

async function interact(
    userSim: types.UserSim.Shared.NotConfirmed,
): Promise<types.UserSim.Shared.Confirmed | undefined> {

    let shouldProceed = await new Promise<"ACCEPT" | "REFUSE" | "LATER">(
        resolve => tools.bootbox_custom.dialog({
            "title": `${userSim.ownership.ownerEmail} would like to share a SIM with you, accept?`,
            "message": userSim.ownership.sharingRequestMessage ?
                `«${userSim.ownership.sharingRequestMessage.replace(/\n/g, "<br>")}»` : "",
            "buttons": {
                "cancel": {
                    "label": "Refuse",
                    "callback": () => resolve("REFUSE")
                },
                "success": {
                    "label": "Yes, use this SIM",
                    "className": "btn-success",
                    "callback": () => resolve("ACCEPT")
                }
            },
            "onEscape": () => resolve("LATER")
        })
    );

    if (shouldProceed === "LATER") {
        return undefined;
    }

    if (shouldProceed === "REFUSE") {

        tools.bootbox_custom.loading("Rejecting SIM sharing request...");

        await api.unregisterSim(userSim.sim.imsi);

        return undefined;

    }

    //TODO: max length for friendly name
    let friendlyNameSubmitted = await new Promise<string | null>(
        resolve => tools.bootbox_custom.prompt({
            "title": "Friendly name for this sim?",
            "value": userSim.friendlyName,
            "callback": result => resolve(result),
        })
    );

    if (friendlyNameSubmitted) {
        userSim.friendlyName = friendlyNameSubmitted;
    }

    tools.bootbox_custom.loading("Accepting SIM sharing request...");

    await api.setSimFriendlyName(
        userSim.sim.imsi,
        userSim.friendlyName
    );

    let confirmedSim = (await api.getUserSims()).filter(
        ({ sim }) => sim.imsi === userSim.sim.imsi
    ).pop()! as types.UserSim.Shared.Confirmed;

    return confirmedSim;

}
