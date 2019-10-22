export declare type VoidSyncEvent = import("ts-events-extended").VoidSyncEvent;
export declare type Structure = import("./types.Structure").Structure;
export declare type Modal = {
    evtHide: VoidSyncEvent;
    evtShown: VoidSyncEvent;
    evtHidden: VoidSyncEvent;
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
