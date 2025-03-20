import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  SafeAreaView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import DocumentScanner from "react-native-document-scanner-plugin";

import BaseModal from "./BaseModal";

import type { ReactNode } from "react";
import type {
  ScanDocumentOptions,
  ScanDocumentResponse,
} from "react-native-document-scanner-plugin";

export interface DocumentScanResult {
  uri: string;
  width?: number;
  height?: number;
  name?: string;
  base64?: string;
}

interface DocumentScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (document: DocumentScanResult) => void;
  children?: ReactNode;
  scannerOptions?: ScannerOptions;
}

interface ScannerOptions extends Partial<ScanDocumentOptions> {
  returnSingleImage?: boolean;
}

const DocumentScannerModal: React.FC<DocumentScannerModalProps> = ({
  visible,
  onClose,
  onCapture,
  children,
  scannerOptions = {},
}) => {
  const {
    maxNumDocuments = 1,
    returnSingleImage = true,
    croppedImageQuality = 100,
    ...otherOptions
  } = scannerOptions;

  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // 컴포넌트가 마운트되거나 visible 상태가 변경될 때 권한 확인
  useEffect(() => {
    if (visible) {
      checkCameraPermission();
    }
  }, [visible]);

  // 카메라 권한 확인
  const checkCameraPermission = async () => {
    try {
      // DocumentScanner 라이브러리는 권한 체크 API를 직접 제공하지 않으므로
      // 스캔을 시도하고 오류 처리로 권한 상태를 확인
      await startScan();
      setHasPermission(true);
    } catch (error: any) {
      console.error("스캐너 권한 오류:", error);
      if (error.message?.includes("permission")) {
        setHasPermission(false);
      }
    }
  };

  // 문서 스캔 시작
  const startScan = useCallback(async () => {
    try {
      setIsScanning(true);

      // 문서 스캐너 옵션 설정
      const options: ScanDocumentOptions = {
        maxNumDocuments,
        croppedImageQuality,
        ...otherOptions,
      };

      // 스캔 실행
      const response: ScanDocumentResponse =
        await DocumentScanner.scanDocument(options);

      if (response?.scannedImages?.length) {
        // 스캔된 이미지를 결과 형식으로 변환
        const results = response.scannedImages.map((uri, index) => ({
          uri,
          name: `scanned_document_${index + 1}.jpg`,
        }));

        // 단일 이미지를 반환할지 여러 이미지를 반환할지 결정
        if (returnSingleImage && results.length > 0) {
          onCapture(results[0]);
        }

        // 스캔이 완료되면 모달 닫기
        onClose();
      }
    } catch (error) {
      console.error("문서 스캔 오류:", error);
      Alert.alert(
        "스캔 오류",
        "문서 스캔 중 오류가 발생했습니다. 다시 시도해주세요.",
      );
    } finally {
      setIsScanning(false);
    }
  }, [
    maxNumDocuments,
    croppedImageQuality,
    otherOptions,
    onCapture,
    onClose,
    returnSingleImage,
  ]);

  // 권한 요청 버튼 클릭
  const requestPermission = async () => {
    try {
      // 권한 요청을 위해 스캔 시도
      await startScan();
      setHasPermission(true);
    } catch (error) {
      console.error("권한 요청 오류:", error);
      Alert.alert(
        "권한 필요",
        "카메라 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.",
        [
          { text: "취소", style: "cancel" },
          {
            text: "설정",
            onPress: () =>
              Platform.OS === "ios"
                ? // iOS는 설정 앱으로 이동
                  void 0
                : void 0 /* Android에서는 적절한 설정 앱 링크 사용 */,
          },
        ],
      );
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

  // 스캐너 시작 화면
  const renderScannerContent = () => (
    <SafeAreaView style={styles.scannerContainer}>
      <View style={styles.scannerContent}>
        {isScanning ? (
          <ActivityIndicator size="large" color="#ffffff" />
        ) : (
          <>
            <Text style={styles.text}>
              문서를 스캔하려면 아래 버튼을 누르세요.
            </Text>
            <TouchableOpacity style={styles.scanButton} onPress={startScan}>
              <Text style={styles.buttonText}>스캔 시작</Text>
            </TouchableOpacity>
            {children}
          </>
        )}
      </View>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <MaterialIcons name="close" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title="문서 스캐너"
      hideHeader={true}
    >
      {hasPermission === false
        ? renderNoPermissionContent()
        : renderScannerContent()}
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
  scannerContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "space-between",
  },
  scannerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
    minWidth: 150,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default DocumentScannerModal;
