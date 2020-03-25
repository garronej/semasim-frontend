

import { ReduceArguments, toReduceArguments } from "./reduceify";

export function arrConcat<ArrOf>(
    arr: readonly ArrOf[],
    elementsToAdd: readonly ArrOf[]
): ArrOf[] {
    return [...arr, ...elementsToAdd ];
}

export function concat<ArrOf>(elementsToAdd: readonly ArrOf[]): ReduceArguments<ArrOf, ArrOf[]> {
    return toReduceArguments(arrConcat, elementsToAdd);
}