import * as types from "./types";
import { provideCustomImplementationOfApi } from "./getApi";
export { types as baseTypes, provideCustomImplementationOfApi as provideCustomImplementationOfBaseApi };
export declare type DialogOptions<T extends types.Type> = types.Options<T> & {
    animate?: boolean;
    show?: true;
};
export declare type DialogApi = {
    create: <T extends types.Type>(method: T, options: DialogOptions<T>) => Promise<void>;
    loading: (message: string, delayBeforeShow?: number) => void;
    dismissLoading: () => void;
};
export declare const startMultiDialogProcess: () => {
    endMultiDialogProcess: () => void;
    dialogApi: DialogApi;
};
export declare const dialogApi: DialogApi;
