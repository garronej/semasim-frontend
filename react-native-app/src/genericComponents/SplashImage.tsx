

import * as React from "react";
import * as rn from "react-native";


export const SplashImage: React.FunctionComponent<{
    imageSource: rn.ImageSourcePropType;
}> = props => (<rn.Image
    style={({ "width": "100%", "height": "100%" })}
    resizeMode="contain"
    source={props.imageSource} />);
