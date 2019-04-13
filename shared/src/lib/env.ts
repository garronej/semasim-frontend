
/** semasim.com or dev.semasim.com */
export const baseDomain = window.location.href.match(/^https:\/\/web\.([^\/]+)/)![1];

export const assetsRoot: string = window["assets_root"];

export const isProd= assetsRoot !== "/";
