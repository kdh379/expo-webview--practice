import { useMemo } from 'react';
import type { WebViewProps } from 'react-native-webview';

type UseWebViewConfigProps = {
  colors: {
    background: string;
    [key: string]: string;
  };
  injectedJavaScript: string;
  originWhitelist: string[];
  onError?: (error: string) => void;
  onHttpError?: (error: string) => void;
};

export const useWebViewConfig = ({
  injectedJavaScript,
  originWhitelist,
  onError,
  onHttpError,
}: UseWebViewConfigProps) => {
  const webViewConfig = useMemo<Partial<WebViewProps>>(
    () => ({
      injectedJavaScript,
      javaScriptEnabled: true,
      domStorageEnabled: true,
      originWhitelist,
      mixedContentMode: 'compatibility',
      onError: (syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.warn('WebView Error:', nativeEvent);
        onError?.(nativeEvent.description);
      },
      onHttpError: (syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.warn('HTTP Error:', nativeEvent);
        onHttpError?.(nativeEvent.description);
      },
    }),
    [injectedJavaScript, originWhitelist, onError, onHttpError]
  );

  return { webViewConfig };
}; 