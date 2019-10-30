
import * as rn from "react-native";
import { firebase } from "@react-native-firebase/messaging";

const log: typeof console.log = true ?
    ((...args: any[]) => console.log.apply(console, ["[askForUserPermissions.android]", ...args])) :
    (() => { });

const askForFirebaseRelatedPermissions = async () => {

    const firebaseCloudMessaging = firebase.messaging()

    if (await firebaseCloudMessaging.hasPermission()) {

        return;

    }

    try {

        await firebaseCloudMessaging.requestPermission();

    } catch (error) {

        throw new Error("user rejected permissions");

    }

};

const askForAndroidPermissions = async ()=> {

    const { PERMISSIONS } = rn.PermissionsAndroid;

    for (const permission of [
        PERMISSIONS.RECORD_AUDIO,
        PERMISSIONS.READ_CONTACTS,
        PERMISSIONS.READ_PHONE_STATE
    ]) {

        log("================>", { permission });

        if (!permission) {

            log("=============> continue");

            continue;

        }

        let permissionStatus: rn.PermissionStatus;

        try {

            permissionStatus = await rn.PermissionsAndroid.request(
                permission,
                {
                    "title": `Semasim ${permission}`,
                    "message": `Grant ${permission} ?`,
                    "buttonPositive": 'OK'
                },
            );

        } catch (error) {

            log("Throw error");

            throw error;

        }

        if (permissionStatus !== rn.PermissionsAndroid.RESULTS.GRANTED) {
            throw new Error(`Need permission ${permission}`);
        }

        log(`${permission} granted`);

    }

};

export const _default: import("./index").PlatformSpecificAskUserForPermissionFn = async ()=>{

    await askForFirebaseRelatedPermissions();

    await askForAndroidPermissions();

};

export default _default;
