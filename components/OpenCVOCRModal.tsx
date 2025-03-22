import { PaintStyle, Skia } from "@shopify/react-native-skia";
import React from "react";
import {
  ColorConversionCodes,
  ContourApproximationModes,
  DataTypes,
  ObjectType,
  OpenCV,
  RetrievalModes,
} from "react-native-fast-opencv";
import { useSkiaFrameProcessor } from "react-native-vision-camera";
import { useResizePlugin } from "vision-camera-resize-plugin";

import VisionCameraModal from "@/components/VisionCameraModal";

import type { Rect } from "react-native-fast-opencv";

interface OpenCVOCRModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

// Skia 페인트 객체 생성 - 탐지된 객체를 표시하는 데 사용
const paint = Skia.Paint();
paint.setStyle(PaintStyle.Fill);
// 탐지된 영역을 표시할 색상 설정 (라임색)
paint.setColor(Skia.Color("lime"));

function OpenCVOCRModal({ visible, onClose, onComplete }: OpenCVOCRModalProps) {
  const { resize } = useResizePlugin();
  const frameProcessor = useSkiaFrameProcessor((frame) => {
    "worklet";

    // 프레임 크기를 1/4로 줄여 처리 속도 향상
    const height = frame.height / 4;
    const width = frame.width / 4;

    // 리사이즈 플러그인을 사용하여 프레임 크기 조정
    const resized = resize(frame, {
      scale: {
        width: width,
        height: height,
      },
      pixelFormat: "bgr", // BGR 형식으로 설정 (OpenCV 기본 형식)
      dataType: "uint8", // 8비트 부호 없는 정수 타입
    });

    // 리사이즈된 버퍼를 OpenCV Mat 객체로 변환
    const src = OpenCV.bufferToMat("uint8", height, width, 3, resized);
    // 결과를 저장할 Mat 객체 생성
    const dst = OpenCV.createObject(ObjectType.Mat, 0, 0, DataTypes.CV_8U);

    // HSV 색공간에서 흰색 범위 설정
    // 흰색은 HSV에서 H(색상)는 관계없고, S(채도)가 낮고, V(명도)가 높은 특성을 가짐
    // H: 0-180 (모든 색상 허용), S: 0-30 (낮은 채도), V: 200-255 (높은 명도)
    const lowerBound = OpenCV.createObject(ObjectType.Scalar, 0, 0, 200);
    const upperBound = OpenCV.createObject(ObjectType.Scalar, 180, 30, 255);

    // BGR 이미지를 HSV 색공간으로 변환
    OpenCV.invoke("cvtColor", src, dst, ColorConversionCodes.COLOR_BGR2HSV);
    // HSV 이미지에서 지정된 색상 범위에 해당하는 픽셀만 추출 (이진화)
    OpenCV.invoke("inRange", dst, lowerBound, upperBound, dst);

    // 채널 분리 (이진화된 이미지에서 작업하기 위함)
    const channels = OpenCV.createObject(ObjectType.MatVector);
    OpenCV.invoke("split", dst, channels);
    // 첫 번째 채널 추출 (이진화된 이미지는 단일 채널이므로 0번 채널만 필요)
    const grayChannel = OpenCV.copyObjectFromVector(channels, 0);

    // 윤곽선 찾기를 위한 MatVector 객체 생성
    const contours = OpenCV.createObject(ObjectType.MatVector);
    // 이진화된 이미지에서 윤곽선 찾기
    OpenCV.invoke(
      "findContours",
      grayChannel,
      contours,
      RetrievalModes.RETR_TREE, // 모든 윤곽선의 계층 구조 검색
      ContourApproximationModes.CHAIN_APPROX_SIMPLE, // 윤곽선 압축 (메모리 절약)
    );

    // 찾은 윤곽선을 JS 값으로 변환
    const contoursMats = OpenCV.toJSValue(contours);
    // 찾은 사각형들을 저장할 배열
    const rectangles: Rect[] = [];

    // 모든 윤곽선을 순회하며 처리
    for (let i = 0; i < contoursMats.array.length; i++) {
      const contour = OpenCV.copyObjectFromVector(contours, i);
      // 윤곽선의 면적 계산
      const { value: area } = OpenCV.invoke("contourArea", contour, false);

      // 면적이 VALUE 보다 큰 윤곽선만 처리 (흰색 객체 탐지를 위해 더 큰 값으로 조정 가능)
      // 참고: 작은 노이즈를 제거하려면 이 값을 더 크게 설정 (예: area > 1000)
      if (area > 100) {
        // 윤곽선을 감싸는 최소 사각형 계산
        const rect = OpenCV.invoke("boundingRect", contour);
        rectangles.push(rect);
      }
    }

    // Skia를 사용하여 탐지된 사각형을 프레임에 그리기
    frame.render();

    // 모든 탐지된 사각형을 순회하며 그리기
    for (const rect of rectangles) {
      // 사각형 정보를 JS 객체로 변환
      const rectangle = OpenCV.toJSValue(rect);

      // 프레임에 사각형 그리기 (크기를 원래 프레임 크기에 맞게 4배 확대)
      frame.drawRect(
        {
          height: rectangle.height * 4,
          width: rectangle.width * 4,
          x: rectangle.x * 4,
          y: rectangle.y * 4,
        },
        paint,
      );
    }

    // 중요: 메모리 누수 방지를 위해 OpenCV 버퍼 정리
    // 프레임 프로세서에서는 이 단계가 필수적임
    OpenCV.clearBuffers();
  }, []);

  return (
    <VisionCameraModal
      visible={visible}
      onClose={onClose}
      onCapture={onComplete}
      frameProcessor={frameProcessor}
    />
  );
}

export default OpenCVOCRModal;
