"use client";

import { useState } from "react";

import { useBridge } from "@/react-example/hooks/useBridge";
import { bridge } from "@/react-example/lib/bridge";

export const BridgeExample = () => {
  const [resText, setResText] = useState<string | null>(null);
  const [cameraResult, setCameraResult] = useState<CameraResult | null>(null);
  useBridge();

  const [ocrResult, setOcrResult] = useState<IDCardOCRResult | null>(null);

  const handleAlertClick = async () => {
    try {
      const result = await bridge("ALERT", {
        title: "Alert Title",
        message: "Alert Message....",
        buttons: [
          {
            text: "확인",
            style: "default",
            actionId: "confirm",
          },
          {
            text: "취소",
            style: "cancel",
            actionId: "cancel",
          },
        ],
      });
      console.log("알림 표시 결과:", result.actionId);
      setResText(JSON.stringify(result));
    } catch (error) {
      console.error("알림 표시 실패:", error);
    }
  };

  const handleCameraClick = async () => {
    try {
      const permissionResult = await bridge(
        "CAMERA_REQUEST_PERMISSION",
        undefined,
      );

      if (permissionResult.camera.granted) {
        const showCameraResult = await bridge("CAMERA_SHOW", {
          flash: "off",
        });
        console.log("카메라 표시 결과:", showCameraResult);
        setResText("카메라 표시 결과:" + JSON.stringify(showCameraResult));
        // setCameraResult(showCameraResult);
      } else {
        console.log("카메라 권한 거부");
        setResText(JSON.stringify(permissionResult));
      }
    } catch (error) {
      console.error("카메라 촬영 실패:", error);
    }
  };

  const handleOCRClick = async () => {
    const { photo, result } = await bridge("OCR", {
      documentType: "ID_CARD",
      quality: 1,
    });
    console.log("OCR 결과:", result);
    setOcrResult(result ?? null);
    setCameraResult(photo ?? null);
    setResText(JSON.stringify(result));
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">브릿지 테스트</h1>

      <div className="space-y-4">
        <div className="space-x-2">
          <button
            onClick={handleAlertClick}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Alert 테스트
          </button>
          <button
            onClick={handleCameraClick}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            카메라 테스트
          </button>
          <button
            onClick={handleOCRClick}
            className="bg-purple-500 text-white px-4 py-2 rounded"
          >
            OCR 테스트
          </button>
        </div>

        <div className="mt-4">
          <p>응답 결과: {resText}</p>
        </div>
        {ocrResult && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">OCR 결과</h2>
            <dl>
              <dt>이름</dt>
              <dd>{ocrResult.name}</dd>
            </dl>
            <dl>
              <dt>주민등록번호</dt>
              <dd>{ocrResult.registrationNumber}</dd>
            </dl>
            <dl>
              <dt>주소</dt>
              <dd>{ocrResult.address}</dd>
            </dl>
            <dl>
              <dt>발급일</dt>
              <dd>{ocrResult.issueDate}</dd>
            </dl>
          </div>
        )}
        {cameraResult && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">카메라 촬영 결과</h2>
            <img
              src={cameraResult.base64 ?? ""}
              alt="카메라 촬영 결과"
              className="w-full h-full rounded-md aspect-square object-cover"
              width={cameraResult.width}
              height={cameraResult.height}
            />
          </div>
        )}
      </div>
    </div>
  );
};
