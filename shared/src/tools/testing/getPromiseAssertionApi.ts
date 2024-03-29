
import { assert } from "../typeSafety";
import { representsSameDataFactory } from "../inDepthComparison";

export function getPromiseAssertionApi(
    params?: { takeIntoAccountArraysOrdering: boolean; }
) {

    const areEquals: <T>(o1: T, o2: T) => boolean =
        params === undefined ?
            (o1, o2) => o1 === o2 :
            representsSameDataFactory({
                "takeIntoAccountArraysOrdering": params.takeIntoAccountArraysOrdering
            }).representsSameData
        ;


    function mustResolve<T>(
        params: {
            promise: Promise<T>;
            expectedData?: T;
            delay?: number
        }
    ): Promise<T> {

        const timer = setTimeout(() => assert(false, "did not resolve in time"), params.delay ?? 0);

        return params.promise.then(data => {
            clearTimeout(timer);
            if (!("expectedData" in params)) {
                return data;
            }
            assert(areEquals(data, params.expectedData), "Not equals expected value");
            return data;
        });

    }

    /** Must reject within delay ms*/
    function mustReject(
        params: {
            promise: Promise<any>,
            expectedRejectedValue?: any,
            delay?: number
        }
    ) {

        const timer = setTimeout(() => assert(false, "did not reject in time"), params.delay ?? 0);

        return params.promise.then(
            () => assert(false, "resolved"),
            error => {

                clearTimeout(timer);

                if ("expectedRejectedValue" in params) {

                    assert(
                        areEquals(
                            error,
                            params.expectedRejectedValue
                        )
                    );

                }

            }
        );

    }

    function mustStayPending(p: Promise<any>): void {

        p
            .then(
                () => assert(false, `Has fulfilled`),
                () => assert(false, `has rejected`)
            )
            ;

    }

    return { mustResolve, mustReject, mustStayPending };

}
