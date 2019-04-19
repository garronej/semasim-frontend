

export function getProducts(assetsRoot: string): import("./types").shop.Product[] {
    return [
        {
            "name": "SIM usb Dongle",
            "shortDescription": "Huawei E180",
            "description": [
                "Provider unlocked, Voice enabled, include SIM adaptor",
                "If you already have a Raspberry PI this is the only device",
                "you need to start using Semasim",
                "Provided with SIM adaptor for nano and micro SIM.",
                "Comes with one year of prepaid subscription"
            ].join(" "),
            "cartImageUrl": `${assetsRoot}img/sample-shop-items/e180_cart.jpg`,
            "imageUrls": [
                `${assetsRoot}img/sample-shop-items/e180.jpg`,
                `${assetsRoot}img/sample-shop-items/e180_1.png`,
                `${assetsRoot}img/sample-shop-items/adapter.jpg`
            ],
            "price": { "eur": 2800 },
            "footprint": "FLAT"
        },
        {
            "name": "Sim adapter",
            "shortDescription": "Adapter for nano and micro SIM",
            "description": "Adapter to put a nano or micro sim in the SIM's dongle",
            "cartImageUrl": `${assetsRoot}img/sample-shop-items/adapter_cart.jpg`,
            "imageUrls": [`${assetsRoot}img/sample-shop-items/adapter.jpg`],
            "price": { "eur": 300 },
            "footprint": "FLAT"
        },
        {
            "name": "Semasim Gateway",
            "shortDescription": "Ready to use semasim gateway",
            "description": [
                "Semasim Gateway powered by Raspberry Pi.",
                "Come with a SIM dongle and an adapter for nano and micro sim.",
                "Support up to 3 SIM ( require additional Sim dongle, sold separately ).",
                "Purchase will grant you one year of free subscription"
            ].join(" "),
            "cartImageUrl": `${assetsRoot}img/sample-shop-items/raspberry.jpg`,
            "imageUrls": [
                `${assetsRoot}img/sample-shop-items/raspberry.jpg`
            ],
            "price": { "eur": 11000 },
            "footprint": "VOLUME"
        }
    ];
};

