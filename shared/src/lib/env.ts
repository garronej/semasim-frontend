
export const baseDomain: "semasim.com" | "dev.semasim.com" = window.location.href.match(/^https:\/\/web\.([^\/]+)/)![1] as any;

//NOTE: Defined at ejs building in templates/head_common.ejs

export const assetsRoot: string = window["assets_root"];
export const isDevEnv: boolean = window["isDevEnv"];
