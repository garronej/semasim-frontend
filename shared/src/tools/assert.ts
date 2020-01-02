
export function assert(condition: any, msg?: string): asserts condition {
    if (!condition) {
        throw new assert.AssertError(msg);
    }
}

export namespace assert {

    export class AssertError extends Error {
        constructor(msg?: string) {

            super([
                "Wrong assertion",
                ...(msg !== undefined ? [msg] : [])
            ].join(": "))

            Object.setPrototypeOf(this, new.target.prototype);
        }

    }

}

/*
(()=>{

    const x: number | string = null as any;

    assert(typeof x === "number");

    x;

    const y: {
        type: "A";
    } | {
        type: "B";
        p: number;
    }= null as any;

    assert( y.type === "B");

    y.p

})();
*/

