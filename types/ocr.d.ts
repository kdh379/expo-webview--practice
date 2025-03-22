/**
 * OCR 관련 타입 정의
 */

type OCRDocumentType = "ID_CARD" | "DRIVER_LICENSE";

interface OCRPayload {
  documentType?: OCRDocumentType;
  quality?: number;
}

interface OCRResponse {
  photo?: CameraResult;
  result?: IDCardOCRResult;
}

// 주민등록증 OCR 결과
interface IDCardOCRResult {
  name?: string;
  registrationNumber?: string;
  address?: string;
  issueDate?: string;
  issuer?: string;
  isValid?: boolean;
  confidence?: number;
  imageBase64?: string; // 원본 이미지 base64 데이터
  uncertainFields?: string[]; // 불확실한 필드 목록 (예: ["address", "issueDate"])
  error?: string; // 오류 메시지
}
