export type ReduceCallbackFunction<ArrOf, ReduceTo> = (
    previousValue: ReduceTo,
    currentValue: ArrOf,
    currentIndex: number,
    array: readonly ArrOf[]
) => ReduceTo;

export type ReduceArguments<ArrOf, ReduceTo> = [ReduceCallbackFunction<ArrOf, ReduceTo>, ReduceTo];

export function toReduceArguments<ArrOf, ReduceTo, Params extends any[]>(
    arrOp: (arr: readonly ArrOf[], ...params: Params) => ReduceTo,//TODO: readonly ArrOf[]
    ...params: Params
): ReduceArguments<ArrOf, ReduceTo> {

    let outWrap: [ReduceTo] | [] = [];

    const reduceCallbackFunction: ReduceCallbackFunction<ArrOf, ReduceTo> = (...[, , , array]) => {

        let out: ReduceTo;

        if ("1" in outWrap) {
            out = outWrap[1];
        } else {
            out = arrOp(array, ...params);
            outWrap = [out];
        }

        return out;

    };

    return [
        reduceCallbackFunction,
        arrOp([], ...params)
    ];

}

