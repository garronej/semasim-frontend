

declare const window: any;

export async function run() {

    console.log("eval dependencies");

    await Promise.all([
        evalJsSIP()
    ]);

}

async function evalJsSIP() {

    Object.assign(
        window,
        {
            //@ts-ignore
            "JsSIP": await import("static_js_libs/jssip_compat/jssip")
            /*
            "JsSIP": await import((()=>{

                let p1 = "static_js_libs/js";
                let p2 = "sip_compat/jssip";

                p1 += 2 === ( 1 + 1 ) ? "" : Date.now();

                return p1 + p2;


            })())
            */
        }
    );

}