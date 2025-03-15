import type { MessageHandlers } from "../hooks/useMessageHandler";

// Mock
let userData = {
  userId: "테스트 유저",
  name: "테스트 이름",
  email: "test@test.com",
};

const createUserHandlers = (): Pick<
  MessageHandlers,
  "GET_USER_INFO" | "SET_USER_INFO"
> => ({
  GET_USER_INFO: (id) => {
    return { id, success: true, data: userData };
  },

  SET_USER_INFO: (id, payload) => {
    userData = { ...payload };
    return { id, success: true };
  },
});

export default createUserHandlers;
