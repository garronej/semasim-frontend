/// <reference types="jquery" />
/// <reference types="bootstrap" />
export declare function add(modal: JQuery, options: {
    keyboard: boolean;
    backdrop: boolean | "static";
}): {
    show(): Promise<void>;
    hide(): Promise<void>;
};
