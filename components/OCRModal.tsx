import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import BaseModal from "./BaseModal";
import CameraModal from "./CameraModal";

interface OCRModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (result: IDCardOCRResult) => void;
  documentType?: OCRDocumentType;
}

const OCRModal: React.FC<OCRModalProps> = ({
  visible,
  onClose,
  onComplete,
  documentType = "ID_CARD",
}) => {
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState<CameraResult | null>(null);
  const [ocrResult, setOcrResult] = useState<IDCardOCRResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 카메라로 사진 촬영 후 처리
  const handleCapture = async (capturedPhoto: CameraResult) => {
    setPhoto(capturedPhoto);
    setIsLoading(true);
    setError(null);

    try {
      // 실제 구현에서는 OCR API 호출
      // 여기서는 예시로 더미 데이터 사용

      // 더미 데이터 (테스트용)
      const dummyResult: IDCardOCRResult = {
        name: "홍길동",
        registrationNumber: "820701-1234567",
        address: "서울특별시 강남구 테헤란로 123 아파트 101동 1234호",
        issueDate: "2019.11.28",
        issuer: "행복특별시 행복구청장",
        isValid: true,
        confidence: 0.95,
        rawText:
          "주민등록증\n홍길동\n820701-1234567\n서울특별시 강남구 테헤란로 123 아파트 101동 1234호\n2019.11.28\n행복특별시 행복구청장",
      };

      // 2초 후 결과 표시 (실제 API 호출 시뮬레이션)
      setTimeout(() => {
        setOcrResult(dummyResult);
        setIsLoading(false);
      }, 2000);
    } catch (err) {
      setError("OCR 처리 중 오류가 발생했습니다.");
      setIsLoading(false);
      console.error("OCR 처리 오류:", err);
    }
  };

  // 다시 스캔하기
  const handleRescan = () => {
    setPhoto(null);
    setOcrResult(null);
    setError(null);
    setShowCamera(true);
  };

  // 완료 처리
  const handleComplete = () => {
    if (ocrResult) {
      onComplete(ocrResult);
      onClose();
    }
  };

  // 모달 닫기 시 상태 초기화
  const handleClose = () => {
    setPhoto(null);
    setOcrResult(null);
    setError(null);
    onClose();
  };

  const getTitle = () => {
    return documentType === "ID_CARD" ? "주민등록증 스캔" : "운전면허증 스캔";
  };

  return (
    <>
      <BaseModal visible={visible} onClose={handleClose} title={getTitle()}>
        <View style={styles.content}>
          {!photo ? (
            <View style={styles.startContainer}>
              <Text style={styles.instruction}>
                {documentType === "ID_CARD"
                  ? "주민등록증을 스캔하여 정보를 추출합니다."
                  : "운전면허증을 스캔하여 정보를 추출합니다."}
              </Text>
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => setShowCamera(true)}
              >
                <MaterialIcons name="camera-alt" size={32} color="#fff" />
                <Text style={styles.scanButtonText}>
                  {documentType === "ID_CARD"
                    ? "주민등록증 촬영하기"
                    : "운전면허증 촬영하기"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.resultContainer}>
              <View style={styles.photoContainer}>
                <Image source={{ uri: photo.uri }} style={styles.photo} />
              </View>

              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#2196F3" />
                  <Text style={styles.loadingText}>
                    {documentType === "ID_CARD"
                      ? "주민등록증 정보를 분석 중입니다..."
                      : "운전면허증 정보를 분석 중입니다..."}
                  </Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleRescan}
                  >
                    <Text style={styles.actionButtonText}>다시 스캔하기</Text>
                  </TouchableOpacity>
                </View>
              ) : ocrResult ? (
                <View style={styles.ocrResultContainer}>
                  <ScrollView style={styles.resultScroll}>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultLabel}>이름</Text>
                      <Text style={styles.resultValue}>{ocrResult.name}</Text>
                    </View>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultLabel}>
                        {documentType === "ID_CARD"
                          ? "주민등록번호"
                          : "면허번호"}
                      </Text>
                      <Text style={styles.resultValue}>
                        {ocrResult.registrationNumber}
                      </Text>
                    </View>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultLabel}>주소</Text>
                      <Text style={styles.resultValue}>
                        {ocrResult.address}
                      </Text>
                    </View>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultLabel}>발급일</Text>
                      <Text style={styles.resultValue}>
                        {ocrResult.issueDate}
                      </Text>
                    </View>
                    <View style={styles.resultItem}>
                      <Text style={styles.resultLabel}>발급처</Text>
                      <Text style={styles.resultValue}>{ocrResult.issuer}</Text>
                    </View>
                  </ScrollView>

                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.secondaryButton]}
                      onPress={handleRescan}
                    >
                      <Text style={styles.secondaryButtonText}>
                        다시 스캔하기
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={handleComplete}
                    >
                      <Text style={styles.actionButtonText}>완료</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </BaseModal>

      <CameraModal
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCapture}
      />
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  startContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  instruction: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  scanButton: {
    backgroundColor: "#2196F3",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    width: "80%",
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  resultContainer: {
    flex: 1,
  },
  photoContainer: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 15,
    backgroundColor: "#eee",
  },
  photo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#f44336",
    textAlign: "center",
    marginBottom: 20,
  },
  ocrResultContainer: {
    flex: 1,
  },
  resultScroll: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  resultItem: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  resultLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  secondaryButtonText: {
    color: "#2196F3",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default OCRModal;
