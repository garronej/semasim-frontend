
export function notifyHostWhenPageIsReady(){
    $(document).ready(() => console.log("->__PAGE_READY__<-"));
}
