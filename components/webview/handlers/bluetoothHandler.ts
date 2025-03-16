import { Platform, PermissionsAndroid } from "react-native";
import { BleManager } from "react-native-ble-plx";

import type { MessageHandlers } from "../hooks/useMessageHandler";
import type { Device } from "react-native-ble-plx";

const manager = new BleManager();

const convertDeviceToBluetoothDevice = (device: Device): BluetoothDevice => ({
  id: device.id,
  name: device.name || undefined,
  rssi: device.rssi || undefined,
  isConnected: false,
});

const createBluetoothHandlers = (
  onBluetoothStatus?: (status: BluetoothStatus, message?: string) => void,
): Pick<
  MessageHandlers,
  | "BLUETOOTH_STATUS"
  | "BLUETOOTH_ENABLE_REQUEST"
  | "BLUETOOTH_SCAN_START"
  | "BLUETOOTH_SCAN_STOP"
  | "BLUETOOTH_CONNECT"
  | "BLUETOOTH_DISCONNECT"
  | "BLUETOOTH_GET_CONNECTED_DEVICES"
  | "REGISTER_BLUETOOTH_CALLBACK"
  | "UNREGISTER_BLUETOOTH_CALLBACK"
> => {
  const callbacks = new Map<
    string,
    (status: BluetoothStatus, message?: string) => void
  >();
  let isScanning = false;
  let scanSubscription: any = null;

  const checkBluetoothPermission = async (): Promise<boolean> => {
    if (Platform.OS === "ios") {
      const state = await manager.state();
      return state === "PoweredOn";
    }

    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "블루투스 권한",
          message: "블루투스 기능을 사용하기 위해 권한이 필요합니다.",
          buttonNeutral: "나중에",
          buttonNegative: "거절",
          buttonPositive: "허용",
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    return false;
  };

  return {
    BLUETOOTH_STATUS: async (id) => {
      const isEnabled = await checkBluetoothPermission();
      const status: BluetoothStatus = isEnabled ? "on" : "off";
      return {
        id,
        success: true,
        data: {
          status,
        },
      };
    },

    BLUETOOTH_ENABLE_REQUEST: async (id) => {
      try {
        const isEnabled = await checkBluetoothPermission();
        if (!isEnabled) {
          return {
            id,
            success: false,
            error: "블루투스 권한이 거부되었습니다.",
          };
        }
        return {
          id,
          success: true,
        };
      } catch (error) {
        return {
          id,
          success: false,
          error: "블루투스 활성화 중 오류가 발생했습니다. error: " + error,
        };
      }
    },

    BLUETOOTH_SCAN_START: async (id) => {
      try {
        if (isScanning) {
          return {
            id,
            success: false,
            error: "이미 스캔 중입니다.",
          };
        }

        const devices: BluetoothDevice[] = [];
        isScanning = true;

        scanSubscription = manager.onStateChange((state) => {
          if (state === "PoweredOn") {
            manager.startDeviceScan(null, null, (error, device) => {
              if (error) {
                console.error("Scan error:", error);
                return;
              }
              if (device) {
                const bluetoothDevice = convertDeviceToBluetoothDevice(device);
                if (!devices.find((d) => d.id === bluetoothDevice.id)) {
                  devices.push(bluetoothDevice);
                }
              }
            });
          }
        }, true);

        return {
          id,
          success: true,
          data: { devices },
        };
      } catch (error) {
        return {
          id,
          success: false,
          error: "스캔 시작 중 오류가 발생했습니다. error: " + error,
        };
      }
    },

    BLUETOOTH_SCAN_STOP: async (id) => {
      try {
        if (!isScanning) {
          return {
            id,
            success: false,
            error: "스캔 중이 아닙니다.",
          };
        }

        manager.stopDeviceScan();
        if (scanSubscription) {
          scanSubscription.remove();
          scanSubscription = null;
        }
        isScanning = false;

        return {
          id,
          success: true,
        };
      } catch (error) {
        return {
          id,
          success: false,
          error: "스캔 중지 중 오류가 발생했습니다. error: " + error,
        };
      }
    },

    BLUETOOTH_CONNECT: async (id, { deviceId }) => {
      try {
        const device = await manager.connectToDevice(deviceId);
        await device.discoverAllServicesAndCharacteristics();

        return {
          id,
          success: true,
          data: {
            deviceId: device.id,
            isConnected: true,
          },
        };
      } catch (error) {
        return {
          id,
          success: false,
          error: "연결 중 오류가 발생했습니다. error: " + error,
        };
      }
    },

    BLUETOOTH_DISCONNECT: async (id, { deviceId }) => {
      try {
        await manager.cancelDeviceConnection(deviceId);
        return {
          id,
          success: true,
          data: {
            deviceId,
            isConnected: false,
          },
        };
      } catch (error) {
        return {
          id,
          success: false,
          error: "연결 해제 중 오류가 발생했습니다. error: " + error,
        };
      }
    },

    BLUETOOTH_GET_CONNECTED_DEVICES: async (id) => {
      try {
        const connectedDevices = await manager.connectedDevices([]);
        return {
          id,
          success: true,
          data: {
            devices: connectedDevices.map(convertDeviceToBluetoothDevice),
          },
        };
      } catch (error) {
        return {
          id,
          success: false,
          error: "연결된 장치 조회 중 오류가 발생했습니다. error: " + error,
        };
      }
    },

    REGISTER_BLUETOOTH_CALLBACK: (id, { callbackId }) => {
      callbacks.set(callbackId, onBluetoothStatus || (() => {}));
      return { id, success: true };
    },

    UNREGISTER_BLUETOOTH_CALLBACK: (id, { callbackId }) => {
      callbacks.delete(callbackId);
      return { id, success: true };
    },
  };
};

export default createBluetoothHandlers;
