import { Modal } from "./types";
export declare function add(modal: Modal): {
    show(): Promise<void>;
    hide(): Promise<void>;
};
