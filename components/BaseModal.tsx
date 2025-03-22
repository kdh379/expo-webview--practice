import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Modal, View, TouchableOpacity, StyleSheet, Text } from "react-native";

interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  hideHeader?: boolean;
}

const BaseModal: React.FC<BaseModalProps> = ({
  visible,
  onClose,
  title,
  children,
  hideHeader = false,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      {!hideHeader && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.placeholder} />
        </View>
      )}

      <View style={styles.content}>{children}</View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    padding: 10,
    zIndex: 1000,
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    width: 34, // 닫기 버튼과 동일한 너비
  },
  content: {
    flex: 1,
  },
});

export default BaseModal;
