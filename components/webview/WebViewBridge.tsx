import React, { useCallback, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

import { Colors } from "@/constants/Colors";

import { useMessageHandler } from "./hooks/useMessageHandler";
import NativeScreenManager, { useNativeScreens } from "./NativeScreenManager";

type WebViewBridgeProps = {
  uri: string;
};

// JSON 데이터를 안전하게 문자열화하는 함수
const safeStringify = (data: any): string => {
  // rawText 필드가 있고 개행 문자가 포함된 경우 처리
  if (
    data &&
    typeof data === "object" &&
    data.data &&
    typeof data.data === "object" &&
    data.data.rawText
  ) {
    // 개행 문자를 이스케이프된 형태로 변환
    data.data.rawText = data.data.rawText.replace(/\n/g, "\\n");
  }

  return JSON.stringify(data);
};

export const WebViewBridge = ({ uri }: WebViewBridgeProps) => {
  const webViewRef = useRef<WebView>(null);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // 컴포넌트 언마운트 시 정리 작업
  useEffect(() => {
    return () => {
      // WebView 참조가 존재하면 로드 중지
      if (webViewRef.current) {
        webViewRef.current.stopLoading();
      }
    };
  }, []);

  // 웹뷰로 응답을 보내는 함수
  const sendResponse = useCallback((id: string, data: any) => {
    const response = {
      id,
      success: true,
      data,
    };

    // 안전한 JSON 문자열화 함수 사용
    const safeJsonString = safeStringify(response);

    webViewRef.current?.injectJavaScript(`
      window.postMessage('${safeJsonString}', '*');
    `);
  }, []);

  // 오류 응답을 보내는 함수
  const sendErrorResponse = useCallback((id: string, error: string) => {
    const response = {
      id,
      success: false,
      error,
    };

    // 안전한 JSON 문자열화 함수 사용
    const safeJsonString = safeStringify(response);

    webViewRef.current?.injectJavaScript(`
      window.postMessage('${safeJsonString}', '*');
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
