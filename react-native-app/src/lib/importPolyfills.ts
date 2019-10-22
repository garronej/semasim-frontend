
declare const process: any;
declare const window: any;

/** 
 * 
 * Attach import polyfills and apply some patch on 
 * the global objects so that "frontend/shared" can be used in react native.
 * ( e.g.  make node Buffer available ) 
 * 
 * Need to be imported:
 * -Apis that are made available by browserify.
 * -Apis that are only available on the web. 
 * ( And for which we do not implement a native module or a separate .native.ts implementation )
 * 
 */
export async function run() {

    process["argv"] = [];

    //NOTE: pbkdf2 module compat
    process["browser"]= true;

    /*
    Object.assign(window, {
        "Buffer": require("buffer/").Buffer,
        "util": require("util")
    });
    */

    await Promise.all([
        import("buffer/").then(({ Buffer }: any)=> Object.assign(window, { Buffer })),
        import("util").then((util: any)=> Object.assign(window, { util }))
    ]);



}
