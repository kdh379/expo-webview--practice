import { NavigationProp } from '@react-navigation/native';
import type { MessageHandlers } from '../lib/createMessageHandler';
import type { BluetoothStatus } from '../types/bridge';
import createUserHandlers from './userHandler';
import createDialogHandlers from './dialogHandler';
import createNavigationHandlers from './navigationHandler';
import createBluetoothHandlers from './bluetoothHandler';

type CreateHandlersOptions = {
  navigation: NavigationProp<any>;
  onBluetoothStatus?: (status: BluetoothStatus, message?: string) => void;
};

export const createHandlers = ({
  navigation,
  onBluetoothStatus,
}: CreateHandlersOptions): Partial<MessageHandlers> => ({
  ...createDialogHandlers(),
  ...createNavigationHandlers(navigation),
  // ...createBluetoothHandlers(onBluetoothStatus),
  ...createUserHandlers(),
}); 