import { Alert } from "react-native";

import type { MessageHandlers } from "../hooks/useMessageHandler";

const createDialogHandlers = (): Pick<MessageHandlers, "ALERT"> => ({
  ALERT: async (id, { title, message, buttons }) => {
    const result = await new Promise<{ index: number; actionId?: string }>(
      (resolve) => {
        Alert.alert(
          title || "알림",
          message,
          buttons.map((button, index) => ({
            text: button.text,
            style: button.style,
            onPress: () => {
              resolve({
                index,
                actionId: button.actionId,
              });
            },
          })),
        );
      },
    );

    return {
      id,
      success: true,
      data: {
        buttonIndex: result.index,
        actionId: result.actionId,
      },
    };
  },
});

export default createDialogHandlers;
