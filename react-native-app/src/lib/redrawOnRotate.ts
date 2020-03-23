
import * as rn from "react-native";

export const redrawOnRotate: import("./appLifeCycle").AppLifeCycleListener = ({
  evtConstructor,
  evtComponentDidMount,
  evtComponentWillUnmount
}) => {

  let handleDimensionChange: () => void;

  evtConstructor.attach(
    component => handleDimensionChange = () => component.forceUpdate()
  );

  evtComponentDidMount.attach(
    () => rn.Dimensions.addEventListener("change", handleDimensionChange)
  );

  evtComponentWillUnmount.attach(
    () => rn.Dimensions.removeEventListener("change", handleDimensionChange)
  );

};