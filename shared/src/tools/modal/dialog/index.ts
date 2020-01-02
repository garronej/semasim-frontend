
import * as modalStack from "../stack";

import * as types from "./types";
import { getApi, provideCustomImplementationOfApi } from "./getApi";
import * as runExclusive from "run-exclusive";

export { types as baseTypes, provideCustomImplementationOfApi as provideCustomImplementationOfBaseApi };




export type DialogOptions<T extends types.Type> = types.Options<T> & {
    animate?: boolean //Default false
    show?: true //Default true 
}

export type DialogApi = {
    create: <T extends types.Type> (method: T, options: DialogOptions<T>) => Promise<void>;
    loading: (message: string, delayBeforeShow?: number) => void;
    dismissLoading: () => void;
};

const noLockDialogApi = (() => {

    let currentLoading: {
        stop: () => void;
        message: string;
        delayBeforeShow: number;
    } | undefined = undefined;

    let currentModal: types.Modal | undefined = undefined;

    let restoreLoading: (() => void) | undefined = undefined;

    const out: DialogApi = {
        "dismissLoading": () => {

            if (!!currentLoading) {
                currentLoading.stop();
                currentLoading = undefined;
            }

            if (!!restoreLoading) {
                restoreLoading = undefined;
            }

        },
        "loading": (message, delayBeforeShow = 700) => {

            if (!!currentModal) {

                restoreLoading = () => out.loading(message, delayBeforeShow);

                return;

            }

            if (!!currentLoading) {
                delayBeforeShow = 0;
            }

            out.dismissLoading();

            let modal: types.Modal | undefined = undefined;

            const timer = setTimeout(
                () => {

                    modal = getApi().createLoading(message);

                    modalStack.add(modal).show();

                },
                delayBeforeShow
            );

            currentLoading = {
                "stop": () => !!modal ? modal.hide() : clearTimeout(timer),
                message,
                delayBeforeShow
            };

        },
        "create": (method, options) => {

            if (!!currentModal) {

                currentModal.hide()

                return out.create(method, options);

            }

            if (!!currentLoading) {

                let message = currentLoading.message;

                let delayBeforeShow = currentLoading.delayBeforeShow;

                out.dismissLoading();

                restoreLoading = () => out.loading(message, delayBeforeShow);

            }


            const modal = getApi().create(
                method,
                {
                    ...options,
                    "show": false,
                    ...("animate" in options ? ({}) : ({ "animate": false }))
                }
            );

            modalStack.add(modal).show();

            currentModal = modal;

            modal.evtHide.attachOnce(() => currentModal = undefined);

            modal.evtHidden.attachOnce(() => {

                if (restoreLoading) {
                    restoreLoading();
                }

                modal.removeFromDom();

            });

            return modal.evtHidden.waitFor();

        }
    };

    return out;


})();


const lockFn = runExclusive.build(async (pr?: Promise<void>) => {

    if (!pr) {
        return;
    }

    await pr;

});


export const startMultiDialogProcess = () => {

    const prLockAcquired = lockFn();

    let endMultiDialogProcess!: () => void;

    lockFn(new Promise<void>(resolve => endMultiDialogProcess = ()=> {

        dialogApi.dismissLoading();

        resolve();

    }));

    const dialogApi: DialogApi = {
        "create": (...args) => prLockAcquired.then(() => noLockDialogApi.create(...args)),
        "loading": (...args) => prLockAcquired.then(() => noLockDialogApi.loading(...args)),
        "dismissLoading": (...args) => prLockAcquired.then(() => noLockDialogApi.dismissLoading(...args))
    };

    return {
        endMultiDialogProcess,
        dialogApi
    };

};

export const dialogApi: DialogApi = {
    "create": async (...args) => {

        const { endMultiDialogProcess, dialogApi: { create } } = startMultiDialogProcess();

        await create(...args);

        endMultiDialogProcess();

    },
    "loading": (...args) => lockFn().then(() => noLockDialogApi.loading(...args)),
    "dismissLoading": (...args) => lockFn().then(() => noLockDialogApi.dismissLoading(...args))
};



