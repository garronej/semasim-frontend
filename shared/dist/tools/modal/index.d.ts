import * as types from "./types";
export { provideCustomImplementationOfApi } from "./getApi";
export declare type Options = types.Options & {
    show?: false;
};
export declare function createModal(structure: types.Structure, options: Options): {
    show(): Promise<void>;
    hide(): Promise<void>;
};
