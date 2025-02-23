// app/+not-found.tsx
import React from 'react';
import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '페이지를 찾을 수 없습니다', headerShown: false }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">요청하신 페이지를 찾을 수 없습니다.</ThemedText>
        <ThemedText style={styles.description}>
          페이지가 존재하지 않거나 잘못된 경로로 접근하셨습니다.
        </ThemedText>
        <Link href="/" style={styles.link}>
          <ThemedText type="link">홈으로 돌아가기</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  description: {
    marginTop: 10,
    textAlign: 'center',
    color: '#666666',
  },
  link: {
    marginTop: 20,
    paddingVertical: 15,
  },
});