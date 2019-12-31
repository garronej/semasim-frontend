
const { name: appName } = require("../../../app.json");
import * as rn from "react-native";
import { componentProvider } from "../../RootComponent";

import "./impl";

rn.AppRegistry.registerComponent(appName, componentProvider);