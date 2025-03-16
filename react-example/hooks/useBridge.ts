"use client";

import { useEffect } from "react";

import { initBridge, cleanupBridge } from "../lib/bridge";

export const useBridge = () => {
  useEffect(() => {
    // 브릿지 초기화
    initBridge();

    console.log("Bridge initialized in useBridge hook");

    // 컴포넌트 언마운트 시 브릿지 정리
    return () => {
      console.log("Cleaning up bridge in useBridge hook");
      cleanupBridge();
    };
  }, []);
};
