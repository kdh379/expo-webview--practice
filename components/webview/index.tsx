/**
 * WebView 브릿지 컴포넌트
 *
 * 웹뷰와 네이티브 간의 통신을 담당하는 컴포넌트입니다.
 */
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
  View,
  SafeAreaView,
} from "react-native";
import { WebView } from "react-native-webview";

import { Colors } from "@/constants/Colors";
import ScreenManager from "@/screens/ScreenManager";

import { useMessageHandler } from "./useMessageHandler";

interface WebViewBridgeProps {
  uri: string;
}

/**
 * 웹뷰 브릿지 컴포넌트
 */
const WebViewBridge: React.FC<WebViewBridgeProps> = ({ uri }) => {
  // 웹뷰 참조
  const webViewRef = React.useRef<WebView>(null);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // 응답 처리 함수
  const handleSendResponse = useCallback((id: string, data: any) => {
    if (!webViewRef.current) return;

    const response = {
      id,
      success: true,
      data,
    };

    // postMessage를 통해 웹뷰로 응답 전송
    webViewRef.current.postMessage(JSON.stringify(response));
  }, []);

  // 에러 응답 처리 함수
  const handleSendErrorResponse = useCallback((id: string, error: string) => {
    if (!webViewRef.current) return;

    const response = {
      id,
      success: false,
      error,
    };

    // postMessage를 통해 웹뷰로 에러 응답 전송
    webViewRef.current.postMessage(JSON.stringify(response));
  }, []);

  // WebView 내부 컴포넌트
  const WebViewWithMessageHandler = () => {
    // 메시지 핸들러 초기화
    const { handleMessage } = useMessageHandler({
      sendResponse: handleSendResponse,
      sendErrorResponse: handleSendErrorResponse,
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
        onError={handleError}
        onHttpError={handleHttpError}
        renderLoading={renderLoading}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScreenManager
        sendResponse={handleSendResponse}
        sendErrorResponse={handleSendErrorResponse}
      >
        <WebViewWithMessageHandler />
      </ScreenManager>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
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

export default WebViewBridge;
