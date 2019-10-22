
import * as types from "./types";
import { getApi } from "./getApi";
import * as stack from "./stack";
export { provideCustomImplementationOfApi } from "./getApi";

export type Options = types.Options & {
    show?: false //Default false 
}

export function createModal(structure: types.Structure, options: Options){

    const modal = getApi().create(
        structure,
        {
            ...options,
            "show": false
        }
    );

    return stack.add(modal);

}
