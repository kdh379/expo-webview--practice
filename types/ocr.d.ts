/**
 * OCR 관련 타입 정의
 */

type OCRDocumentType = "ID_CARD" | "DRIVER_LICENSE";

// OCR 요청 옵션
interface OCRPayload {
  imageUri: string;
  base64?: string;
  documentType?: OCRDocumentType;
  language?: string;
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
  rawText?: string;
}

// OCR 결과 타입
type OCRResponse = IDCardOCRResult | string;
