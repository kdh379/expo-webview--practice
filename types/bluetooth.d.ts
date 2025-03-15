type BluetoothStatus = "on" | "off" | "unauthorized" | "unavailable";

type BluetoothDevice = {
  id: string;
  name?: string;
  rssi?: number;
  isConnected?: boolean;
};

type BluetoothScanResult = {
  devices: BluetoothDevice[];
};

type BluetoothConnectionResult = {
  deviceId: string;
  isConnected: boolean;
  error?: string;
};

type BluetoothCallbackPayload = {
  callbackId: string;
};
