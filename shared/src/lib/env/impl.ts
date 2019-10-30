
//NOTE: Defined at ejs building in templates/head_common.ejs
const default_: import("./index").Env = {
    "assetsRoot": window["assets_root"],
    "isDevEnv": window["isDevEnv"],
    "baseDomain": window.location.href.match(/^https:\/\/web\.([^\/]+)/)![1] as any,
    "jsRuntimeEnv": "browser",
    "hostOs": undefined
};

export default default_;
