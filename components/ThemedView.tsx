import { useColorScheme, View } from "react-native";

import { Colors } from "@/constants/Colors";

import type { ViewProps } from "react-native";

export const ThemedView = (props: ViewProps) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const colors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <View
      {...props}
      style={[props.style, { backgroundColor: colors.background }]}
    />
  );
};
