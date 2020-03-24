
import { Evt } from "frontend-shared/node_modules/evt";
import * as rn from "react-native";

export const appLifeCycleEvents = {
  "evtConstructor": new Evt<React.Component>(),
  "evtComponentDidMount": new Evt<React.Component>(),
  "evtComponentWillUnmount": new Evt<React.Component>(),
  "evtRootViewOnLayout": new Evt<{
    component: React.Component;
    layoutChangeEvent: rn.LayoutChangeEvent;
  }>(),
};

export type AppLifeCycleEvents= typeof appLifeCycleEvents;

export type AppLifeCycleListener = (appLifeCycleEvents: AppLifeCycleEvents) => void;

export function addAppLifeCycleListeners(
  appLifeCycleListeners: AppLifeCycleListener[]
) {

  for (const appLifeCycleListener of appLifeCycleListeners) {

    appLifeCycleListener(appLifeCycleEvents);

  }

}




