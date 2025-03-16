"use client";

import { useEffect, useState } from "react";

import { useBridge } from "../hooks/useBridge";
import { bridge } from "../lib/bridge";

export const BridgeExample = () => {
  const [resText, setResText] = useState<string | null>(null);
  const [cameraResult, setCameraResult] = useState<CameraResult | null>(null);
  useBridge();
  // const [bluetoothStatus, setBluetoothStatus] =
  // useState<BluetoothStatus>("off");
  const [ocrResult, setOcrResult] = useState<IDCardOCRResult | null>(null);
  const [userInfo, _setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    // 블루투스 상태 변경 감지
    // const cleanup = bridgeListener("BLUETOOTH_STATUS", ({ data }) => {
    //   console.log("블루투스 상태 변경:", data);
    // });
    // 사용자 정보 가져오기
    // bridge("GET_USER_INFO", undefined).then(setUserInfo).catch(console.error);
    console.log("webview mounted");

    // return () => cleanup();
  }, []);

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
      // const permissionResult = await bridge.camera.requestPermission();
      const permissionResult = await bridge(
        "CAMERA_REQUEST_PERMISSION",
        undefined,
      );

      if (permissionResult.camera.granted) {
        const showCameraResult = await bridge("CAMERA_SHOW", {
          quality: "2160p",
          flash: "off",
          facing: "back",
        });
        console.log("카메라 표시 결과:", showCameraResult);
        // setResText("카메라 표시 결과:" + JSON.stringify(showCameraResult));
        setCameraResult(showCameraResult);
      } else {
        console.log("카메라 권한 거부");
        setResText(JSON.stringify(permissionResult));
      }
    } catch (error) {
      console.error("카메라 촬영 실패:", error);
    }
  };

  const handleOCRClick = async () => {
    const result = await bridge("OCR_SCAN_ID_CARD", {
      documentType: "ID_CARD",
      includeImageBase64: true,
      quality: 1,
    });
    const { imageBase64, ...ocrResult } = result;
    setOcrResult(result);
    setResText(JSON.stringify(ocrResult));
  };

  // const handleBluetoothEnableClick = async () => {
  //   try {
  //     const result = await bridge.bluetooth.requestEnable();
  //     console.log("블루투스 활성화 결과:", result);
  //   } catch (error) {
  //     console.error("블루투스 활성화 요청 실패:", error);
  //   }
  // };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">브릿지 테스트</h1>

      <div className="space-y-4">
        {/* <div>
          <h2 className="text-xl font-semibold mb-2">블루투스 상태</h2>
          <p>현재 상태: {bluetoothStatus}</p>
          <button
            onClick={handleBluetoothEnableClick}
            className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
          >
            블루투스 활성화
          </button>
        </div> */}

        <div>
          <h2 className="text-xl font-semibold mb-2">사용자 정보</h2>
          {userInfo ? (
            <pre className="p-2 rounded">
              {JSON.stringify(userInfo, null, 2)}
            </pre>
          ) : (
            <p>사용자 정보를 불러오는 중...</p>
          )}
        </div>

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
