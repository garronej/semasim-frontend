

export type Default = (reason: string)=>Promise<never>;

import * as impl from "./impl";


const beforeRestartActions: (()=> void | Promise<void>)[]= [];

export function registerActionToPerformBeforeAppRestart( action: ()=> void | Promise<void>) {
    beforeRestartActions.push(action);
}

function matchPromise(obj: any): obj is Promise<any> {
    return (
        obj instanceof Object &&
        typeof (obj as Promise<any>).then === "function"
    );
}

export const restartApp: Default = async (...args) => {

    const tasks: Promise<void>[]= [];

    for( const action of beforeRestartActions ){

        const prOrVoid= action();

        if( !matchPromise(prOrVoid) ){
            continue;
        }

        tasks.push(prOrVoid);

    }

    if( tasks.length !== 0 ){
        await Promise.all(tasks);
    }

    return impl.default(...args);

};



