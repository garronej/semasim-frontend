
import { env } from "../env";

const default_: import("./index").Default = reason=> { 

    if( env.isDevEnv ){
        alert(`About to restart app, reason: ${reason}`);
    }

    location.reload();

    return new Promise<never>(()=>{});

}

export default default_;

