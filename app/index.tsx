import React from "react";
import { View, StyleSheet } from "react-native";

import { WebViewBridge } from "@/components/webview/WebViewBridge";

import { NEXT_URL } from "../constants/env";

export default function App() {
  return (
    <View style={styles.container}>
      <WebViewBridge uri={NEXT_URL} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    width: "100%",
    height: "100%",
  },
});
