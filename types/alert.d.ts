type AlertPayload = {
  title?: string;
  message: string;
  buttons: CustomAlertButton[];
};

type AlertResponse = {
  buttonIndex: number;
  actionId?: string;
};

type CustomAlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  actionId?: string;
};

type CustomAlertPayload = {
  title?: string;
  message: string;
  buttons: CustomAlertButton[];
};
