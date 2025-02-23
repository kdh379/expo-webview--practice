import { NavigationProp } from "@react-navigation/native";
import type { MessageHandlers } from "../lib/createMessageHandler";
const createNavigationHandlers = (
  navigation: NavigationProp<any>
): Pick<MessageHandlers, 'NAVIGATE'> => ({
  NAVIGATE: (id, { screen, params }) => {
    navigation.navigate(screen, params);
    return { id, success: true };
  },
});

export default createNavigationHandlers;