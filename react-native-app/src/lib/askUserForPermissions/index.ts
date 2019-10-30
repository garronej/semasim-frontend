

export type PlatformSpecificAskUserForPermissionFn = ()=> Promise<void>;

import platformSpecificAskUserForPermission from "./impl";

//TODO: Error handling! 
export const askUserForPermissions = async () => {

    await platformSpecificAskUserForPermission()

};




