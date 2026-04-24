// Suppress React Native version mismatch warning in Vibecode (native 0.81.5 vs JS 0.79.6)
const _origConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  if (typeof args[0] === "string" && args[0].includes("React Native version mismatch")) {
    return;
  }
  _origConsoleError(...args);
};

import "react-native-get-random-values";
import "react-native-reanimated";
import { LogBox } from "react-native";
import "./global.css";
import "expo-router/entry";
LogBox.ignoreLogs(["Expo AV has been deprecated", "Disconnected from Metro"]);
