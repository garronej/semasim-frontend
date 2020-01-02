

export function assert(condition: any, msg?: string): asserts condition {
    if (!condition) {
        throw new Error(msg)
    }
}

    export class AssertError extends Error {
        constructor(msg?: string) {
            super(`Wrong assertion ${msg!=}`);
            Object.setPrototypeOf(this, new.target.prototype);
        }

        public toString(): string {

            return [
                `InitializationError: ${this.message}`,
                `Cause: ${this.srcError}`,
                `Modem infos: ${util.format(this.modemInfos)}`
            ].join("\n");

        }
    }


