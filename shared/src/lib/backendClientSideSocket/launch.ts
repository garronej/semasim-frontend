import * as store from "./store";
import * as localApiHandlers from "./localApiHandlers";
import * as sipLibrary from "ts-sip";
import * as remoteApiCaller from "./remoteApiCaller";

export const url = "wss://www.semasim.com";

//TODO: leverage HTML5 isOnline

export async function launch() {

    if( localApiHandlers.evtOpenElsewhere.getHandlers().length === 0 ){

        localApiHandlers.evtOpenElsewhere.attachOnce(()=> {

            //TODO: Improve

            alert([
                "You opened Semasim in an other browser tab ( or on an other computer )",
                "Only one Semasim tab can be open at the same time"
            ].join(" "));

        });

        localApiHandlers.evtSimIsOnlineStatusChange.attach(userSim=>{

            //TODO: notification

            console.log(`Sim ${userSim.sim.imsi} is now ${userSim.isOnline?"online":"offline"}`);

        });

        localApiHandlers.evtSharingRequestResponse.attach(({ userSim, email, isAccepted })=> {

            console.log(`${email} ${isAccepted?"accepted":"refused"} to share sim ${userSim.sim.imsi}`);

        });

        localApiHandlers.evtSharedSimUnregistered.attach(({userSim, email})=> {

            console.log(`${email} no longer share SIM ${userSim.sim.imsi}`);

        });


        localApiHandlers.evtContactCreatedOrUpdated.attach( ({ contact })=> {

            console.log(`Contact created or updated by other SIM user: `, contact);

        });

        localApiHandlers.evtContactDeleted.attach(({ contact } )=>{
            
            console.log(`Contact deleted by other SIM user user: `, contact);

        });

        remoteApiCaller.evtUsableSim.attach(userSim=> {

            console.log(`SIM: ${userSim.sim.imsi} registered by user`);

        });

    }
    

    const backendSocketInst = new sipLibrary.Socket(
        new WebSocket(url, "SIP"),
        {
            "localAddress": "__unknown__",
            "localPort": -1,
            "remoteAddress": "semasim.com",
            "remotePort": 443
        }
    );

    store.set(backendSocketInst);

    backendSocketInst.evtClose.attachOnce(() => {

        if( localApiHandlers.evtOpenElsewhere.postCount !== 0 ){
            return;
        }

        launch();

    });

}