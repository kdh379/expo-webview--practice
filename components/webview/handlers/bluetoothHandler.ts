import { BluetoothStatus } from "../types/bridge";
import { MessageHandlers } from "../lib/createMessageHandler";
import { Platform, Linking, PermissionsAndroid } from "react-native";
import { BleManager } from 'react-native-ble-plx';

const manager = new BleManager();

const createBluetoothHandlers = (
): Pick<
  MessageHandlers,
  | 'BLUETOOTH_STATUS_CHECK'
  | 'BLUETOOTH_ENABLE_REQUEST'
  | 'UNREGISTER_BLUETOOTH_CALLBACK'
  | 'BLUETOOTH_STATUS'
> => {
  const callbacks = new Map<string, (status: BluetoothStatus, message?: string) => void>();

  const checkBluetoothPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      const state = await manager.state();
      return state === 'PoweredOn';
    }

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: '블루투스 권한',
          message: '블루투스 기능을 사용하기 위해 권한이 필요합니다.',
          buttonNeutral: '나중에',
          buttonNegative: '거절',
          buttonPositive: '허용',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    return false;
  };

  return {
    BLUETOOTH_STATUS_CHECK: async (id) => {
      try {
        const isEnabled = await checkBluetoothPermission();
        return { 
          id, 
          success: true, 
          data: { 
            status: isEnabled ? 'on' as const : 'off' as const 
          } 
        };
      } catch (error) {
        return { 
          id, 
          success: false, 
          error: '블루투스 상태 확인 중 오류가 발생했습니다.' 
        };
      }
    },

    BLUETOOTH_ENABLE_REQUEST: async (id) => {
      try {
        if (Platform.OS === 'ios') {
          // iOS에서는 시스템 설정으로 이동
          await Linking.openSettings();
          return { 
            id, 
            success: true, 
            data: { 
              status: 'pending' as const,
              message: '설정에서 블루투스를 활성화해주세요.' 
            } 
          };
        }

        if (Platform.OS === 'android') {
          const permission = await checkBluetoothPermission();
          if (!permission) {
            return { 
              id, 
              success: false, 
              error: '블루투스 권한이 거부되었습니다.' 
            };
          }

          await manager.enable();
          return { 
            id, 
            success: true, 
            data: { 
              status: 'on' as const 
            } 
          };
        }

        return { 
          id, 
          success: false, 
          error: '지원하지 않는 플랫폼입니다.' 
        };
      } catch (error) {
        return { 
          id, 
          success: false, 
          error: '블루투스 활성화 중 오류가 발생했습니다.' 
        };
      }
    },

    UNREGISTER_BLUETOOTH_CALLBACK: (id, { callbackId }) => {
      callbacks.delete(callbackId);
      return { id, success: true };
    },

    BLUETOOTH_STATUS: (id, { status, message }) => {
      callbacks.forEach((callback) => callback(status as BluetoothStatus, message));
      return { id, success: true };
    },
  };
};

export default createBluetoothHandlers;