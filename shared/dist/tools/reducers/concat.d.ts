import { ReduceArguments } from "./reduceify";
export declare function arrConcat<ArrOf>(arr: readonly ArrOf[], elementsToAdd: readonly ArrOf[]): ArrOf[];
export declare function concat<ArrOf>(elementsToAdd: readonly ArrOf[]): ReduceArguments<ArrOf, ArrOf[]>;
