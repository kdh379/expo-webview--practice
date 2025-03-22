/**
 * 스크린 관리 관련 타입 정의
 *
 * 전역 타입과 함께 사용되는 스크린 관련 타입들
 */

// BridgeResponse는 전역 타입으로 이미 정의되어 있으므로 직접 사용
// 필요한 경우에만 참조 추가

/**
 * 스크린 컴포넌트 타입
 *
 * 스크린 컴포넌트 타입 작성 시 extends 해주세요.
 */
export interface ScreenComponentProps<T_Payload = any, T_Result = any> {
  visible: boolean;
  payload: T_Payload;
  onClose: () => void;
  onComplete: (result: T_Result) => void;
}

// 스크린 컨트롤러 인터페이스
export interface ScreenController {
  showScreen: (name: BridgeType, id: string, payload?: any) => boolean;
  closeScreen: (result?: unknown) => void;
}
