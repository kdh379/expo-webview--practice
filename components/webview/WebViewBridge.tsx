import React, { useCallback, useRef } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

import { Colors } from "@/constants/Colors";

import { INJECTED_JAVASCRIPT } from "./constants/injectedScript";
import { useMessageHandler } from "./hooks/useMessageHandler";
import NativeScreenManager, { useNativeScreens } from "./NativeScreenManager";

type WebViewBridgeProps = {
  uri: string;
};

export const WebViewBridge = ({ uri }: WebViewBridgeProps) => {
  const webViewRef = useRef<WebView>(null);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // 웹뷰로 응답을 보내는 함수
  const sendResponse = useCallback((id: string, data: any) => {
    const response = {
      id,
      success: true,
      data,
    };

    webViewRef.current?.injectJavaScript(`
      window.postMessage('${JSON.stringify(response)}', '*');
    `);
  }, []);

  // 오류 응답을 보내는 함수
  const sendErrorResponse = useCallback((id: string, error: string) => {
    const response = {
      id,
      success: false,
      error,
    };

    webViewRef.current?.injectJavaScript(`
      window.postMessage('${JSON.stringify(response)}', '*');
    `);
  }, []);

  // 내부 컴포넌트: 웹뷰와 메시지 핸들러
  const WebViewWithMessageHandler = () => {
    // 네이티브 스크린 컨트롤러 초기화
    const { screenController } = useNativeScreens();

    // 메시지 핸들러 초기화
    const { handleMessage } = useMessageHandler({
      sendResponse,
      sendErrorResponse,
      screenController,
    });

    const renderLoading = () => (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );

    const handleError = (syntheticEvent: any) => {
      const { nativeEvent } = syntheticEvent;
      console.warn("WebView Error:", nativeEvent);
    };

    const handleHttpError = (syntheticEvent: any) => {
      const { nativeEvent } = syntheticEvent;
      console.warn("HTTP Error:", nativeEvent);
    };

    return (
      <WebView
        ref={webViewRef}
        source={{ uri }}
        style={[styles.webview, { backgroundColor: colors.background }]}
        onMessage={handleMessage}
        injectedJavaScript={INJECTED_JAVASCRIPT}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsBackForwardNavigationGestures={true}
        originWhitelist={["*"]}
        mixedContentMode="compatibility"
        renderLoading={renderLoading}
        onError={handleError}
        onHttpError={handleHttpError}
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* 네이티브 스크린 관리자 */}
      <NativeScreenManager sendResponse={sendResponse}>
        <WebViewWithMessageHandler />
      </NativeScreenManager>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  webview: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});
