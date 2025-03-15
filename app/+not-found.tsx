// app/+not-found.tsx
import { Link, Stack } from "expo-router";
import React from "react";
import { Linking, StyleSheet, TouchableOpacity } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen
        options={{ title: "페이지를 찾을 수 없습니다", headerShown: false }}
      />
      <ThemedView style={styles.container}>
        <ThemedText type="title">
          요청하신 페이지를 찾을 수 없습니다.
        </ThemedText>
        <ThemedText style={styles.description}>
          페이지가 존재하지 않거나 잘못된 경로로 접근하셨습니다.
        </ThemedText>
        <Link href="/" style={styles.link}>
          <ThemedText type="link">홈으로 돌아가기</ThemedText>
        </Link>
        {/* 앱 링크 재접속 */}
        <TouchableOpacity
          onPress={() => {
            // 앱 링크 재접속 로직
            Linking.openURL("http://localhost:3000");
          }}
        >
          <ThemedText type="link">앱 링크 재접속</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  description: {
    marginTop: 10,
    textAlign: "center",
    color: "#666666",
  },
  link: {
    marginTop: 20,
    paddingVertical: 15,
  },
});
