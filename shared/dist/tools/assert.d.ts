export declare function assert(condition: any, msg?: string): asserts condition;
export declare namespace assert {
    class AssertError extends Error {
        constructor(msg?: string);
    }
}
