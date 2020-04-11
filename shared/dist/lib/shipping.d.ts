export declare function solve(destinationCountryIso: string, footprint: "FLAT" | "VOLUME", weight: number): {
    carrier: string;
    offer: string;
    delay: [number, number];
    eurAmount: number;
    needLightPackage: boolean;
};
