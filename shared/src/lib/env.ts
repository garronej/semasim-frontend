
/** semasim.com or dev.semasim.com */
export const baseDomain = window.location.href.match(/^https:\/\/web\.([^\/]+)/)![1];


//NOTE: Defined at ejs building in templates/head_common.ejs

export const assetsRoot: string = window["assets_root"];
export const isDevEnv: boolean = window["isDevEnv"];
