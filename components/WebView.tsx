import React, { useRef, useCallback } from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, View, ActivityIndicator, SafeAreaView, useColorScheme, Platform } from 'react-native';

type BluetoothStatus = 'on' | 'off' | 'unauthorized' | 'unsupported';

type WebViewMessage = {
  type: string;
  data?: any;
} | {
  type: 'CONSOLE';
  logType: string;
  message: string;
} | {
  type: 'BLUETOOTH_STATUS_CHECK';
} | {
  type: 'BLUETOOTH_ENABLE_REQUEST';
} | BluetoothMessage;

type BluetoothMessage = {
  type: 'BLUETOOTH_STATUS';
  status: BluetoothStatus;
  message?: string;
};

interface WebViewComponentProps {
  uri: string;
  onMessage?: (event: any) => void;
  onBluetoothStatus?: (status: BluetoothStatus, message?: string) => void;
}

const WebViewComponent: React.FC<WebViewComponentProps> = ({ uri, onMessage, onBluetoothStatus }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const backgroundColor = isDarkMode ? '#0a0a0a' : '#ffffff';
  const foregroundColor = isDarkMode ? '#ededed' : '#171717';

  const webViewRef = useRef<WebView>(null);

  // 웹뷰에 상태 업데이트를 전달하는 함수
  const sendStatusToWebView = useCallback((status: BluetoothStatus, message?: string) => {
    const script = `
      if (window.BluetoothBridge && window.BluetoothBridge.onStatusChange) {
        window.BluetoothBridge.onStatusChange('${status}', '${message || ''}');
      }
    `;
    webViewRef.current?.injectJavaScript(script);
  }, []);

  // 블루투스 상태 체크 처리
  const handleBluetoothStatusCheck = useCallback(() => {
    // TODO: 네이티브 블루투스 상태 체크 구현
    // 예시: NativeModule을 통한 블루투스 상태 체크
    // BluetoothModule.checkStatus()
    //   .then(status => sendStatusToWebView(status))
    //   .catch(error => console.error('블루투스 상태 체크 실패:', error));
  }, [sendStatusToWebView]);

  // 블루투스 활성화 요청 처리
  const handleBluetoothEnableRequest = useCallback(() => {
    // TODO: 네이티브 블루투스 활성화 요청 구현
    // 예시: NativeModule을 통한 블루투스 활성화
    // BluetoothModule.requestEnable()
    //   .then(result => sendStatusToWebView(result.status, result.message))
    //   .catch(error => console.error('블루투스 활성화 요청 실패:', error));
  }, [sendStatusToWebView]);

  // 최소한의 초기화 스크립트
  const INJECTED_JAVASCRIPT = `
    (function() {
      // 콘솔 로그 캡처
      const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error
      };

      Object.keys(originalConsole).forEach(type => {
        console[type] = function(...args) {
          const message = args.map(item => {
            try {
              return typeof item === 'object' ? JSON.stringify(item) : String(item);
            } catch (e) {
              return String(item);
            }
          }).join(' ');
          
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'CONSOLE',
            logType: type,
            message: message
          }));
          
          originalConsole[type].apply(console, args);
        };
      });

      true;
    })();
  `;

  const handleMessage = useCallback((event: any) => {
    try {
      const data: WebViewMessage = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'CONSOLE':
          if ('logType' in data && 'message' in data) {
            console.log(`[WebView ${data.logType}]:`, data.message);
          }
          break;
          
        case 'BLUETOOTH_STATUS_CHECK':
          handleBluetoothStatusCheck();
          break;
          
        case 'BLUETOOTH_ENABLE_REQUEST':
          handleBluetoothEnableRequest();
          break;
          
        case 'BLUETOOTH_STATUS':
          const bluetoothData = data as BluetoothMessage;
          if (onBluetoothStatus) {
            onBluetoothStatus(bluetoothData.status, bluetoothData.message);
          }
          sendStatusToWebView(bluetoothData.status, bluetoothData.message);
          break;
      }

      if (onMessage) {
        onMessage(event);
      }
    } catch (error) {
      console.error('메시지 파싱 에러:', error);
    }
  }, [onMessage, onBluetoothStatus, handleBluetoothStatusCheck, handleBluetoothEnableRequest, sendStatusToWebView]);

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" />
    </View>
  );

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView Error:', nativeEvent);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <WebView
        ref={webViewRef}
        source={{ uri }}
        style={[styles.webview, { backgroundColor }]}
        onMessage={handleMessage}
        injectedJavaScript={INJECTED_JAVASCRIPT}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsFullscreenVideo={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        renderLoading={renderLoading}
        onError={handleError}
        originWhitelist={['*']}
        mixedContentMode="compatibility"
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('HTTP Error:', nativeEvent);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  webview: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WebViewComponent;