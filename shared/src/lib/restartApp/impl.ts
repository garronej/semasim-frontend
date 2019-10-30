
import { env } from "../env";

const default_: import("./index").Default = ()=> { 

    if( env.isDevEnv ){
        throw new Error("In prod the app would have been restarted");
    }

    location.reload();

}

export default default_;

