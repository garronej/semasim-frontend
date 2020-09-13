
import React, { useState, useMemo, useCallback } from "react";
import * as rn from "react-native";
import * as types from "frontend-shared/dist/lib/types";
import { phoneNumber as phoneNumberLib } from "frontend-shared/node_modules/phone-number/dist/lib";
import type { DialogApi } from "frontend-shared/dist/tools/modal/dialog";
import type { restartApp } from "frontend-shared/dist/lib/restartApp";
import { useCanCall } from "./lib/hooks/useCanCall";
import { Picker } from "@react-native-community/picker";

const log: typeof console.log = true ?
    ((...args: any[]) => console.log(...["[TestComponent]", ...args])) :
    (() => { });

(async () => {

    while (true) {

        await new Promise(resolve => setTimeout(resolve, 5000));

        log("tick!");

    }

})();

log("imported");

export const TestComponent: React.FunctionComponent<{
    dialogApi: DialogApi
    restartApp: typeof restartApp,
    webphones: types.Webphone[];
    accountManagementApi: types.AccountManagementApi;
}> = props => {

    const { dialogApi, restartApp, webphones, accountManagementApi } = props;

    const [phoneNumberRaw, setPhoneNumberRaw] = useState("06 36 78 63 85");

    const [webphone, setWebphone] = useState(webphones[0]);

    const prettyPhoneNumber = useMemo(() => {

        const iso = webphone.userSim.sim.country?.iso

        const phoneNumber = phoneNumberLib.build(
            phoneNumberRaw,
            iso
        );

        if (!phoneNumberLib.isDialable(phoneNumber)) {
            return undefined;
        }

        return phoneNumberLib.prettyPrint(
            phoneNumber,
            iso
        )

    }, [phoneNumberRaw]);


    const canCall = useCanCall({
        phoneNumberRaw,
        webphone
    });

    const placePhoneCall = useCallback(
        async () => {

            const wdChat = await webphone.getOrCreateWdChat({
                "number_raw": phoneNumberRaw
            });

            webphone.placeOutgoingCall(wdChat);

        },
        [webphone, phoneNumberRaw]
    );

        return (
            <rn.View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <rn.Text>Logged with: {accountManagementApi.email}</rn.Text>

                <rn.Text>Selected sim: </rn.Text>
                <Picker
                    selectedValue={webphone.userSim.sim.imsi}
                    style={{ "height": 50, "width": "100%" }}
                    onValueChange={imsi =>
                        setWebphone(
                            webphones.find(({ userSim: { sim } }) => sim.imsi == imsi)!
                        )
                    }>
                    {webphones.map(
                        ({userSim}) =>
                            <Picker.Item
                                label={userSim.friendlyName}
                                value={userSim.sim.imsi}
                                key={userSim.sim.imsi}
                            />
                    )}
                </Picker>

                <rn.Text>Phone number</rn.Text>
                <rn.TextInput
                    style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
                    onChangeText={text => setPhoneNumberRaw(text)}
                    value={phoneNumberRaw}
                />

                <rn.Button
                    onPress={placePhoneCall}
                    title={`Call ${prettyPhoneNumber} with ${webphone.userSim.friendlyName}`}
                    color="#841584"
                    disabled={!canCall}
                />

                <rn.TouchableOpacity
                    style={{ backgroundColor: "grey", marginTop: 30 }}
                    onPress={() => restartApp("User required to restart")}>
                    <rn.Text>Restart app</rn.Text>
                </rn.TouchableOpacity>
                <rn.TouchableOpacity
                    style={{ backgroundColor: "red", marginTop: 30 }}
                    onPress={() => {

                        dialogApi.create("alert", { "message": "Hello word" });

                        setTimeout(
                            () => props.restartApp("Testing restart after dialog"),
                            5000
                        );

                    }}>
                    <rn.Text>Show dialog then restart</rn.Text>
                </rn.TouchableOpacity>
            </rn.View>
        );

    };






