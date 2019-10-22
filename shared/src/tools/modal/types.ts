
export type VoidSyncEvent = import("ts-events-extended").VoidSyncEvent;
export type Structure = import("./types.Structure").Structure;

export type Modal = {
    evtHide: VoidSyncEvent; //Must fire synchronously after hide() called
    evtShown: VoidSyncEvent;
    evtHidden: VoidSyncEvent;
    show(): void;
    hide(): void;
    removeFromDom(): void;
};

export type Options= Partial<{
    backdrop: "static" | boolean; //Default: true
    keyboard: boolean; //Default: true
    show: false; //Default: true
}>;

export type Api = {
    create: (structure: Structure, options: Options)=> Modal;
};
