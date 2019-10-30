
const { name: appName}= require("../../../app.json");
import {AppRegistry} from "react-native";
import { componentProvider } from "../../PreloadComponent";

import "./impl";

AppRegistry.registerComponent(appName, componentProvider);