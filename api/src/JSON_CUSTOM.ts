
export function stringify(obj: any): string {

    if (obj === undefined) {
        return "undefined";
    }

    return JSON.stringify([obj]);

}

export function parse(str: string): any {

    if (str === "undefined") {
        return undefined;
    }

    return JSON.parse(str).pop();
}
