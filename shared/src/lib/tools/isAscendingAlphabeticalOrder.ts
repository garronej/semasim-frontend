
export function isAscendingAlphabeticalOrder(
    a: string,
    b: string
): boolean {

    if (!a || !b) {
        return a.length < b.length;
    }

    let getWeight = (str: string): number => {

        let val = str.charAt(0).toLowerCase().charCodeAt(0);

        if (!(96 < val && val < 123)) {
            return 123;
        }

        return val;

    }

    let vA = getWeight(a);
    let vB = getWeight(b);

    if (vA === vB) {
        return isAscendingAlphabeticalOrder(a.substr(1), b.substr(1));
    }

    return vA < vB;

}
