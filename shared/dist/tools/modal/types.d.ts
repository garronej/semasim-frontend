export declare type VoidEvt = import("evt").VoidEvt;
export declare type Structure = import("./types.Structure").Structure;
export declare type Modal = {
    evtHide: VoidEvt;
    evtShown: VoidEvt;
    evtHidden: VoidEvt;
    show(): void;
    hide(): void;
    removeFromDom(): void;
};
export declare type Options = Partial<{
    backdrop: "static" | boolean;
    keyboard: boolean;
    show: false;
}>;
export declare type Api = {
    create: (structure: Structure, options: Options) => Modal;
};
