
import { ReduceArguments, toReduceArguments } from "./reduceify";

export function arrPush<ArrOf>(
    arr: readonly ArrOf[],
    e: ArrOf
): ArrOf[] {

    const arrCopy= [...arr];

    arrCopy.push(e);

    return arrCopy;

}

export function push<ArrOf>(e: ArrOf): ReduceArguments<ArrOf, ArrOf[]> {
    return toReduceArguments(arrPush, e);
}