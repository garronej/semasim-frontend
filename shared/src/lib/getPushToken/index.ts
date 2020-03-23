
export type Default = (params: { assertJsRuntimeEnv: "react-native"; })=>Promise<string>;

import getPushToken from "./impl";

export { getPushToken };

