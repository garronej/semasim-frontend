
export type VoidEvt = import("evt").VoidEvt;
export type Structure = import("./types.Structure").Structure;

export type Modal = {
    evtHide: VoidEvt; //Must fire synchronously after hide() called
    evtShown: VoidEvt;
    evtHidden: VoidEvt;
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
