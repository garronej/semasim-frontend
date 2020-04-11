import { ReduceArguments } from "./reduceify";
export declare function arrPush<ArrOf>(arr: readonly ArrOf[], e: ArrOf): ArrOf[];
export declare function push<ArrOf>(e: ArrOf): ReduceArguments<ArrOf, ArrOf[]>;
