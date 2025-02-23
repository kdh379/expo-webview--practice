import { useEffect, useState } from 'react';
import { bridge } from '@/lib/bridge';
import { useBridge } from '@/hooks/useBridge';
import type { BluetoothStatus, UserInfo } from '@/types/bridge';

export const BridgeExample = () => {
  useBridge();
  const [bluetoothStatus, setBluetoothStatus] = useState<BluetoothStatus>('off');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    // 블루투스 상태 변경 감지
    bridge.bluetooth.onStatusChange((status, message) => {
      console.log('블루투스 상태 변경:', status, message);
      setBluetoothStatus(status);
    });

    // 초기 블루투스 상태 확인
    bridge.bluetooth.checkStatus().catch(console.error);

    // 사용자 정보 가져오기
    bridge.getUserInfo().then(setUserInfo).catch(console.error);
  }, []);

  const handleAlertClick = async () => {
    try {
      await bridge.alert('알림 테스트', '브릿지가 정상적으로 동작합니다.');
    } catch (error) {
      console.error('알림 표시 실패:', error);
    }
  };

  const handleConfirmClick = async () => {
    try {
      const confirmed = await bridge.confirm('확인', '계속 진행하시겠습니까?');
      if (confirmed) {
        await bridge.toast('확인되었습니다.');
      }
    } catch (error) {
      console.error('확인 대화상자 표시 실패:', error);
    }
  };

  const handleBluetoothEnableClick = async () => {
    try {
      const result = await bridge.bluetooth.requestEnable();
      console.log('블루투스 활성화 결과:', result);
    } catch (error) {
      console.error('블루투스 활성화 요청 실패:', error);
    }
  };

  const handleNavigateClick = () => {
    bridge.navigate('Profile', { userId: userInfo?.id }).catch(console.error);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">브릿지 테스트</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">블루투스 상태</h2>
          <p>현재 상태: {bluetoothStatus}</p>
          <button
            onClick={handleBluetoothEnableClick}
            className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
          >
            블루투스 활성화
          </button>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">사용자 정보</h2>
          {userInfo ? (
            <pre className="bg-gray-100 p-2 rounded">
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
            알림 테스트
          </button>
          <button
            onClick={handleConfirmClick}
            className="bg-yellow-500 text-white px-4 py-2 rounded"
          >
            확인 테스트
          </button>
          <button
            onClick={handleNavigateClick}
            className="bg-purple-500 text-white px-4 py-2 rounded"
          >
            페이지 이동
          </button>
        </div>
      </div>
    </div>
  );
}; 