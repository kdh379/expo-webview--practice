import { MaterialIcons } from "@expo/vector-icons";
import IonIcon from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
  SafeAreaView,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  PinchGestureHandler,
} from "react-native-gesture-handler";
import Reanimated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedProps,
  useSharedValue,
} from "react-native-reanimated";
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
} from "react-native-vision-camera";

import BaseModal from "./BaseModal";

import type { ReactNode } from "react";
import type { PinchGestureHandlerGestureEvent } from "react-native-gesture-handler";
import type {
  CameraPosition,
  CameraRuntimeError,
  DrawableFrameProcessor,
  PhysicalCameraDeviceType,
  Point,
  ReadonlyFrameProcessor,
  TakePhotoOptions,
} from "react-native-vision-camera";

// 애니메이션 카메라 생성
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);
Reanimated.addWhitelistedNativeProps({
  zoom: true,
});

// 상수
const MAX_ZOOM_FACTOR = 8;
const SCALE_FULL_ZOOM = 3;
const BUTTON_SIZE = 44;
const CONTENT_SPACING = 15;

interface CameraResult {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  exif?: any;
}

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (camera: CameraResult) => void;
  showIdCardGuide?: boolean;
  children?: ReactNode;
  cameraOptions?: VisionCameraOptions;
  frameProcessor?: ReadonlyFrameProcessor | DrawableFrameProcessor;
  cameraRef?: React.RefObject<Camera>;
}

interface VisionCameraOptions {
  physicalDevices?: PhysicalCameraDeviceType[];
}

const VisionCameraModal: React.FC<CameraModalProps> = ({
  visible,
  onClose,
  onCapture,
  children,
  frameProcessor,
  cameraOptions,
  cameraRef: externalCameraRef,
}) => {
  const {
    physicalDevices = [
      "telephoto-camera",
      "ultra-wide-angle-camera",
      "wide-angle-camera",
    ],
  } = cameraOptions || {};
  // 카메라 권한
  const { hasPermission, requestPermission } = useCameraPermission();
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>("back");
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [enableHdr, setEnableHdr] = useState(false);
  const [enableNightMode, setEnableNightMode] = useState(false);
  const [targetFps, setTargetFps] = useState(30);

  // 포커스 관련 상태
  const [focusPosition, setFocusPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const focusAnimatedValue = useRef(new Animated.Value(1)).current;

  // 카메라 디바이스 및 줌 관련
  const device = useCameraDevice(cameraPosition, {
    physicalDevices: physicalDevices,
  });
  const zoom = useSharedValue(1);
  const cameraRef = externalCameraRef || useRef<Camera>(null);

  // 화면 비율 계산 (16:9)
  const screenAspectRatio = 16 / 9;

  // 카메라 포맷 설정
  const format = useCameraFormat(device, [
    { photoAspectRatio: screenAspectRatio },
    { photoResolution: "max" },
    { fps: targetFps },
  ]);

  // 줌 관련 설정
  const minZoom = device?.minZoom ?? 1;
  const maxZoom = Math.min(device?.maxZoom ?? 1, MAX_ZOOM_FACTOR);

  // 기능 지원 확인
  const supportsFlash = device?.hasFlash ?? false;
  const supportsHdr = format?.supportsPhotoHdr ?? false;
  const supports60Fps = device?.formats.some((f) => f.maxFps >= 60) ?? false;
  const canToggleNightMode = device?.supportsLowLightBoost ?? false;

  // 애니메이션 프롭스
  const cameraAnimatedProps = useAnimatedProps(() => {
    const z = Math.max(Math.min(zoom.value, maxZoom), minZoom);
    return { zoom: z };
  }, [maxZoom, minZoom, zoom]);

  // 권한 확인
  useEffect(() => {
    if (visible && !hasPermission) {
      requestPermission();
    }
  }, [visible, hasPermission, requestPermission]);

  // 초점 애니메이션 효과
  useEffect(() => {
    if (focusPosition) {
      // 초점 표시기 애니메이션 시작
      focusAnimatedValue.setValue(1);
      Animated.timing(focusAnimatedValue, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        // 애니메이션 완료 후 초점 표시기 숨기기
        setFocusPosition(null);
      });
    }
  }, [focusPosition, focusAnimatedValue]);

  // zoom을 device 변경 시 재설정
  useEffect(() => {
    zoom.value = device?.neutralZoom ?? 1;
  }, [zoom, device]);

  // 에러 핸들러
  const onError = useCallback((error: CameraRuntimeError) => {
    console.error("카메라 오류:", error);
  }, []);

  // 카메라 초기화 완료 핸들러
  const onInitialized = useCallback(() => {
    setIsCameraInitialized(true);
  }, []);

  // 카메라 방향 전환
  const onFlipCameraPressed = useCallback(() => {
    setCameraPosition((p) => (p === "back" ? "front" : "back"));
  }, []);

  // 플래시 모드 전환
  const onFlashPressed = useCallback(() => {
    setFlash((f) => (f === "off" ? "on" : "off"));
  }, []);

  // 화면 터치 시 초점 맞추기
  const handleFocus = useCallback(
    (point: Point) => {
      try {
        const camera = cameraRef.current;
        if (!camera || !device?.supportsFocus) return;
        console.log("focus", point);
        camera.focus(point);
        setFocusPosition({
          x: point.x,
          y: point.y,
        });
      } catch (error) {
        console.error("초점 설정 오류:", error);
      }
    },
    [device?.supportsFocus],
  );

  // 핀치 줌 제스처 핸들러
  const onPinchGesture = useAnimatedGestureHandler<
    PinchGestureHandlerGestureEvent,
    { startZoom: number }
  >({
    onStart: (_, context) => {
      context.startZoom = zoom.value;
    },
    onActive: (event, context) => {
      // 스케일 제스처를 선형 줌으로 매핑
      const startZoom = context.startZoom ?? 0;
      const scale = interpolate(
        event.scale,
        [1 - 1 / SCALE_FULL_ZOOM, 1, SCALE_FULL_ZOOM],
        [-1, 0, 1],
        Extrapolate.CLAMP,
      );
      zoom.value = interpolate(
        scale,
        [-1, 0, 1],
        [minZoom, startZoom, maxZoom],
        Extrapolate.CLAMP,
      );
    },
  });

  // 사진 촬영
  const takePicture = async () => {
    if (cameraRef.current && isCameraInitialized) {
      try {
        // 사진 촬영 옵션
        const options: TakePhotoOptions = {
          flash: flash,
        };

        // 지원되는 경우 HDR 및 야간 모드 추가
        if (format?.supportsPhotoHdr) {
          // @ts-ignore - HDR 지원을 위해 타입 무시
          options.photoHdr = enableHdr;
        }

        if (device?.supportsLowLightBoost) {
          // @ts-ignore - 저조도 부스트 지원을 위해 타입 무시
          options.lowLightBoost = enableNightMode;
        }

        const photo = await cameraRef.current.takePhoto(options);

        // 사진 정보를 결과 형식으로 변환
        onCapture({
          uri: `file://${photo.path}`,
          width: photo.width,
          height: photo.height,
          exif: photo.metadata,
        });
      } catch (error) {
        console.error("사진 촬영 오류:", error);
      }
    }
  };

  // 권한이 없는 경우의 컨텐츠
  const renderNoPermissionContent = () => (
    <SafeAreaView style={styles.permissionContainer}>
      <View style={styles.permissionContainer}>
        <Text style={styles.text}>카메라 접근 권한이 없습니다.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>권한 요청</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>닫기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // 초점 표시기 렌더링
  const renderFocusIndicator = () => {
    if (!focusPosition) return null;

    return (
      <Animated.View
        style={[
          styles.focusIndicator,
          {
            left: focusPosition.x - 25,
            top: focusPosition.y - 25,
            opacity: focusAnimatedValue,
            transform: [
              {
                scale: focusAnimatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      />
    );
  };

  // 카메라 컨텐츠
  const renderCameraContent = () => {
    // 사용 가능한 카메라가 없는 경우
    if (!device) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.text}>사용 가능한 카메라가 없습니다.</Text>
        </View>
      );
    }

    // 탭 제스처를 통한 초점 설정
    const tapGesture = Gesture.Tap().onEnd(({ x, y }) => {
      runOnJS(handleFocus)({ x, y });
    });

    // HDR 및 야간 모드 설정
    const photoHdr = format?.supportsPhotoHdr && enableHdr;
    const lowLightBoost = device.supportsLowLightBoost && enableNightMode;

    return (
      <View style={styles.cameraContainer}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <PinchGestureHandler
            onGestureEvent={onPinchGesture as any}
            enabled={visible}
          >
            <Reanimated.View style={{ flex: 1 }}>
              <GestureDetector gesture={tapGesture}>
                <View style={styles.cameraWrapper}>
                  <ReanimatedCamera
                    ref={cameraRef}
                    style={styles.camera}
                    device={device}
                    isActive={visible}
                    format={format}
                    fps={targetFps}
                    photoHdr={photoHdr}
                    lowLightBoost={lowLightBoost}
                    photo={true}
                    enableZoomGesture={false}
                    animatedProps={cameraAnimatedProps}
                    onInitialized={onInitialized}
                    onError={onError}
                    frameProcessor={frameProcessor}
                  >
                    <View style={styles.topButtonRow}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={onClose}
                      >
                        <MaterialIcons name="close" size={24} color="white" />
                      </TouchableOpacity>
                    </View>

                    {renderFocusIndicator()}
                    {children}
                  </ReanimatedCamera>
                </View>
              </GestureDetector>
            </Reanimated.View>
          </PinchGestureHandler>
        </GestureHandlerRootView>

        {/* 촬영 버튼 */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
            disabled={!isCameraInitialized || !visible}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>

        {/* 우측 버튼 열 */}
        <View style={styles.rightButtonRow}>
          <TouchableOpacity style={styles.button} onPress={onFlipCameraPressed}>
            <IonIcon name="camera-reverse" color="white" size={24} />
          </TouchableOpacity>

          {supportsFlash && (
            <TouchableOpacity style={styles.button} onPress={onFlashPressed}>
              <IonIcon
                name={flash === "on" ? "flash" : "flash-off"}
                color="white"
                size={24}
              />
            </TouchableOpacity>
          )}

          {supports60Fps && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => setTargetFps((t) => (t === 30 ? 60 : 30))}
            >
              <Text style={styles.fpsText}>{`${targetFps}\nFPS`}</Text>
            </TouchableOpacity>
          )}

          {supportsHdr && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => setEnableHdr((h) => !h)}
            >
              <MaterialCommunityIcons
                name={enableHdr ? "hdr" : "hdr-off"}
                color="white"
                size={24}
              />
            </TouchableOpacity>
          )}

          {canToggleNightMode && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => setEnableNightMode((n) => !n)}
            >
              <IonIcon
                name={enableNightMode ? "moon" : "moon-outline"}
                color="white"
                size={24}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title="카메라"
      hideHeader={hasPermission}
    >
      {!hasPermission ? renderNoPermissionContent() : renderCameraContent()}
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
  cameraWrapper: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  topButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  rightButtonRow: {
    position: "absolute",
    right: CONTENT_SPACING,
    top: CONTENT_SPACING + 40,
  },
  text: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
  },
  fpsText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: CONTENT_SPACING,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
  button: {
    marginBottom: CONTENT_SPACING,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: "rgba(140, 140, 140, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: "rgba(40, 40, 40, 0.3)",
    justifyContent: "center",
    alignItems: "center",
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
  focusIndicator: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "transparent",
  },
});

export default VisionCameraModal;
