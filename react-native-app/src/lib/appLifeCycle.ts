
import { SyncEvent } from "frontend-shared/node_modules/ts-events-extended";
import * as rn from "react-native";

export const appLifeCycleEvents = {
  "evtConstructor": new SyncEvent<React.Component>(),
  "evtComponentDidMount": new SyncEvent<React.Component>(),
  "evtComponentWillUnmount": new SyncEvent<React.Component>(),
  "evtRootViewOnLayout": new SyncEvent<{
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




