import { useEffect } from "react";

import { initBridge } from "@/lib/bridge";

export const useBridge = () => {
  useEffect(() => {
    initBridge();
  }, []);
};
