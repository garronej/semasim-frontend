

export function getProducts(assetsRoot: string): import("./types/shop").Product[] {
    return [
        {
            "name": "Semasim Gateway v1.0",
            "shortDescription": "PiZero powered",
            "description": [
                "-Fully plug and play",
                "-Support for one SIM card.",
                "-Support up to 3 SIM ( require additional Sim dongle, sold separately ).",
                "-Grant you 6 month of free access to Semasim subscriptions"
            ].join(" "),
            "cartImageUrl": `${assetsRoot}img/sample-shop-items/raspberry.jpg`,
            "imageUrls": [
                `${assetsRoot}img/sample-shop-items/raspberry.jpg`
            ],
            "price": { "eur": 5900 },
            "footprint": "FLAT",
            "weight": 150
        },
        {
            "name": "SIM usb Dongle",
            "shortDescription": "Huawei E180",
            "description": [
                "Add support for more SIM cards on your Semasim gateway.",
                "OR if you already have a server like a raspberry pi you do not need",
                "the semasim gateway you simply need one of those dongles for every",
                "SIM that you want to put online. [Ref for installing manually]"
            ].join(" "),
            "cartImageUrl": `${assetsRoot}img/sample-shop-items/e180_cart.jpg`,
            "imageUrls": [
                `${assetsRoot}img/sample-shop-items/e180.jpg`,
                `${assetsRoot}img/sample-shop-items/e180_1.png`,
                `${assetsRoot}img/sample-shop-items/adapter.jpg`
            ],
            "price": { "eur": 1490 },
            "footprint": "FLAT",
            "weight": 35
        },
        {
            "name": "Sim adapter",
            "shortDescription": "Adapter for nano and micro SIM",
            "description": "Adapter to put a nano or micro sim in the SIM's dongle",
            "cartImageUrl": `${assetsRoot}img/sample-shop-items/adapter_cart.jpg`,
            "imageUrls": [`${assetsRoot}img/sample-shop-items/adapter.jpg`],
            "price": { "eur": 290 },
            "footprint": "FLAT",
            "weight": 10
        }
    ];
};

