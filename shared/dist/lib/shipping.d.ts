export declare function estimateShipping(destinationCountryIso: string, footprint: import("./types").shop.Footprint): {
    isTracked: Boolean;
    delay: number | [number, number];
    eurAmount: number;
    premium?: {
        eurAmountExtra: number;
        betterDelay: [number, number];
    };
};
