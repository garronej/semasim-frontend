
import * as rn from "react-native";

/*
const width = 360;
const height= 480;

const { width, height } = Dimensions.get('window');
export const w = (percent: number) => Math.floor(width * percent / 100) + 1;
export const h = (percent: number) => Math.floor(height * percent / 100) + 1;

export const percentageOfDiagonalDp = (num: number) => Math.floor(Math.sqrt((height * height) + (width * width)) * num / 100) + 1;
*/

const ov= {
    "PORTRAIT": {
        "width": undefined as (number | undefined),
        "height": undefined as (number | undefined)
    },
    "LANDSCAPE": {
        "width": undefined as (number | undefined),
        "height": undefined as (number | undefined)
    }
}



export const fixDimensions: import("./appLifeCycle").AppLifeCycleListener = ({ evtRootViewOnLayout }) => {

    if( rn.Platform.OS === "ios" ){
        return;
    }

    const overrideWindowDimensions = (windowDimensions: { width: number; height: number }) => {

        const windowDimensionsCurrent = get();
        const orientation = getOrientation();

        let wasCorrected = false;

        for (const dim of ["width", "height"] as const) {

            const [currentValue, value] = [windowDimensionsCurrent, windowDimensions].map(o => o[dim]);

            if (value === currentValue || Math.abs(value / currentValue - 1) > 0.1) {
                continue;
            }

            ov[orientation][dim] = value;
            wasCorrected = true;

        }

        return { wasCorrected };

    };


    evtRootViewOnLayout.attach(
        ({ layoutChangeEvent: { nativeEvent: { layout } }, component }) => {

            const { width, height } = layout;

            const { wasCorrected } = overrideWindowDimensions({ width, height });

            if (!wasCorrected) {
                return;
            }

            component.forceUpdate();

        }
    );


};


function get() {

    const { width, height } = ov[getOrientation()];

    const windowDimensionsDefault = rn.Dimensions.get("window");

    return {
        "width": width || windowDimensionsDefault.width,
        "height": height || windowDimensionsDefault.height
    }

}


export const w = (percent: number) => get().width * percent / 100;
export const h = (percent: number) => get().height * percent / 100;

export const percentageOfDiagonalDp = (num: number) => {

    const { width, height } = get();

    return Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)) * num / 100;

}

export function getOrientation(): "PORTRAIT" | "LANDSCAPE" {
    const { width, height } = rn.Dimensions.get("window");
    return width <= height ? "PORTRAIT" : "LANDSCAPE";
}

