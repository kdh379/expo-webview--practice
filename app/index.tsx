import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NEXT_URL } from '../constants/env';
import { WebViewBridge } from '@/components/webview/WebViewBridge';

export default function App() {
  const handleWebViewMessage = (data: any) => {
    console.log('웹뷰로부터 메시지 수신:', data);
    // 여기서 웹뷰로부터 받은 메시지를 처리합니다
  };

  return (
    <View style={styles.container}>
      {/* <WebViewComponent
        uri={NEXT_URL}
        onMessage={handleWebViewMessage}
      /> */}
      <WebViewBridge uri={NEXT_URL} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    width: '100%',
    height: '100%',
  },
}); 