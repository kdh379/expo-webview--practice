import React from 'react';
import { WebView } from 'react-native-webview';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import type { RootParamList } from '@/types/navigation';
import { INJECTED_JAVASCRIPT } from './constants/injectedScript';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useMessageHandler } from './hooks/useMessageHandler';

type WebViewBridgeProps = {
  uri: string;
};

export const WebViewBridge = ({ uri }: WebViewBridgeProps) => {
  const navigation = useNavigation<NavigationProp<RootParamList>>();
  const webViewRef = React.useRef<WebView>(null);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const sendResponse = React.useCallback((response: any) => {
    webViewRef.current?.injectJavaScript(`
      window.postMessage('${JSON.stringify(response)}', '*');
    `);
  }, []);

  const { handleMessage } = useMessageHandler({
    navigation,
    sendResponse,
  });

  return (
    <WebView
      style={{ backgroundColor: colors.background }}
      ref={webViewRef}
      source={{ uri }}
      onMessage={handleMessage}
      injectedJavaScript={INJECTED_JAVASCRIPT}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      originWhitelist={['*']}
      mixedContentMode="compatibility"
      onError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.warn('WebView Error:', nativeEvent);
      }}
      onHttpError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.warn('HTTP Error:', nativeEvent);
      }}
    />
  );
}; 