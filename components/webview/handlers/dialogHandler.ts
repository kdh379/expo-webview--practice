import { Alert } from 'react-native';
import type { MessageHandlers } from '../lib/createMessageHandler';

const createDialogHandlers = (): Pick<MessageHandlers, 'ALERT' | 'CONFIRM' | 'TOAST'> => ({
  ALERT: async (id, { title, message }) => {
    await new Promise<void>((resolve) => {
      Alert.alert(title || '알림', message, [{ text: '확인', onPress: () => resolve() }]);
    });
    return { id, success: true };
  },

  CONFIRM: async (id, { title, message, confirmText = '확인', cancelText = '취소' }) => {
    const result = await new Promise<boolean>((resolve) => {
      Alert.alert(title || '확인', message, [
        { text: cancelText, onPress: () => resolve(false) },
        { text: confirmText, onPress: () => resolve(true) },
      ]);
    });
    return { id, success: true, data: { confirmed: result } };
  },

  TOAST: (id, { message }) => {
    // TODO: 실제 Toast 구현체 사용
    console.log('Toast:', message);
    return { id, success: true };
  },
});

export default createDialogHandlers;