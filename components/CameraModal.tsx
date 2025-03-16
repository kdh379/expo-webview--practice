import { MaterialIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useState, useRef, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";

import BaseModal from "./BaseModal";

import type {
  CameraCapturedPicture,
  CameraPictureOptions,
  CameraType,
  FlashMode,
} from "expo-camera";

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (camera: CameraResult) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({
  visible,
  onClose,
  onCapture,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [type, setType] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const cameraRef = useRef<any>(null);

  // 카메라 권한 요청
  useEffect(() => {
    if (visible && permission && !permission.granted) {
      requestPermission();
    }
  }, [visible, permission, requestPermission]);

  // 카메라 방향 전환
  const toggleCameraType = () => {
    setType((current) => (current === "back" ? "front" : "back"));
  };

  // 플래시 모드 전환
  const toggleFlash = () => {
    setFlash((current) => {
      if (current === "off") return "on";
      if (current === "on") return "auto";
      return "off";
    });
  };

  // 사진 촬영
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const options: CameraPictureOptions = {
          base64: true,
          quality: 0.7,
          exif: true,
        };
        const photo: CameraCapturedPicture =
          await cameraRef.current.takePictureAsync(options);

        onCapture({
          uri: photo.uri,
          width: photo.width,
          height: photo.height,
          base64: `data:image/jpeg;base64,${photo.base64}`,
          exif: photo.exif,
        });
        onClose(); // 사진 촬영 후 모달 닫기
      } catch (error) {
        console.error("사진 촬영 오류:", error);
      }
    }
  };

  // 권한이 없는 경우의 컨텐츠
  const renderNoPermissionContent = () => (
    <View style={styles.permissionContainer}>
      <Text style={styles.text}>카메라 접근 권한이 없습니다.</Text>
      <TouchableOpacity style={styles.button} onPress={requestPermission}>
        <Text style={styles.buttonText}>권한 요청</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={onClose}>
        <Text style={styles.buttonText}>닫기</Text>
      </TouchableOpacity>
    </View>
  );

  // 카메라 컨텐츠
  const renderCameraContent = () => (
    <View style={styles.cameraContainer}>
      {permission?.granted ? (
        <>
          <CameraView
            style={styles.camera}
            facing={type}
            flash={flash}
            ref={cameraRef}
          >
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.iconButton} onPress={onClose}>
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={toggleFlash}>
                <MaterialIcons
                  name={
                    flash === "off"
                      ? "flash-off"
                      : flash === "on"
                        ? "flash-on"
                        : "flash-auto"
                  }
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          </CameraView>
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.cameraButton} onPress={takePicture}>
              <View style={styles.cameraButtonInner} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={toggleCameraType}
            >
              <MaterialIcons
                name="flip-camera-android"
                size={28}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.text}>카메라를 불러오는 중...</Text>
        </View>
      )}
    </View>
  );

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title="카메라"
      hideHeader={permission?.granted}
    >
      {permission && !permission.granted
        ? renderNoPermissionContent()
        : renderCameraContent()}
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  text: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
  },
  bottomBar: {
    height: 100,
    backgroundColor: "black",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  cameraButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
  flipButton: {
    position: "absolute",
    right: 30,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 5,
    margin: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CameraModal;
