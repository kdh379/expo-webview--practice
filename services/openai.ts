import * as FileSystem from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import OpenAI from "openai";

// OpenAI API 키 설정
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || "";

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // 브라우저 환경에서 사용 허용 (주의: 프로덕션에서는 서버 측에서 처리하는 것이 좋음)
});

// 신분증 비율 (가로:세로 = 8.5:5.4)
const ID_CARD_RATIO = 8.5 / 5.4;

/**
 * 이미지를 신분증 비율에 맞게 크롭하는 함수
 * @param imageUri 이미지 URI
 * @returns 크롭된 이미지 URI
 */
const cropToIDCardRatio = async (imageUri: string): Promise<string> => {
  try {
    // 이미지 정보 가져오기
    const imageInfo = await FileSystem.getInfoAsync(imageUri);
    if (!imageInfo.exists) {
      throw new Error("이미지 파일이 존재하지 않습니다.");
    }

    // 이미지 크기 정보 가져오기
    const manipResult = await manipulateAsync(
      imageUri,
      [], // 변환 없이 이미지 정보만 가져옴
      { compress: 1 },
    );

    const { width, height } = manipResult;

    // 현재 이미지 비율 계산
    const currentRatio = width / height;

    // 크롭할 영역 계산
    let cropWidth = width;
    let cropHeight = height;
    let originX = 0;
    let originY = 0;

    if (currentRatio > ID_CARD_RATIO) {
      // 이미지가 신분증보다 더 넓은 경우, 가로를 자름
      cropWidth = height * ID_CARD_RATIO;
      // 가로 크롭 시 중앙에서 약간 오른쪽으로 조정 (신분증 정보가 더 잘 보이도록)
      originX = (width - cropWidth) / 2 - width * 0.02; // 2% 정도 왼쪽으로 조정

      // 조정된 originX가 이미지 범위를 벗어나지 않도록 보정
      if (originX < 0) {
        originX = 0;
      } else if (originX + cropWidth > width) {
        originX = width - cropWidth;
      }
    } else {
      // 이미지가 신분증보다 더 좁은 경우, 세로를 자름
      cropHeight = width / ID_CARD_RATIO;
      // 세로 크롭 시 약간 아래쪽으로 조정 (신분증이 화면 중앙보다 약간 아래에 위치하도록)
      originY = (height - cropHeight) / 2 + height * 0.05; // 5% 정도 아래로 조정

      // 조정된 originY가 이미지 범위를 벗어나지 않도록 보정
      if (originY < 0) {
        originY = 0;
      } else if (originY + cropHeight > height) {
        originY = height - cropHeight;
      }
    }

    // 이미지 크롭
    const croppedResult = await manipulateAsync(
      imageUri,
      [
        {
          crop: {
            originX,
            originY,
            width: cropWidth,
            height: cropHeight,
          },
        },
      ],
      { compress: 0.8, format: SaveFormat.JPEG },
    );

    return croppedResult.uri;
  } catch (error) {
    console.error("이미지 크롭 오류:", error);
    return imageUri; // 오류 발생 시 원본 이미지 반환
  }
};

// 이미지 전처리 함수
export const preprocessImage = async (
  imageUri: string,
  base64Data?: string,
): Promise<string> => {
  try {
    // 1. 신분증 비율에 맞게 이미지 크롭
    const croppedImageUri = await cropToIDCardRatio(imageUri);

    // 2. 이미지 리사이징 및 압축
    const manipResult = await manipulateAsync(
      croppedImageUri,
      [{ resize: { width: 800 } }], // 너비 800으로 리사이징, 높이는 비율에 맞게 자동 조정
      { compress: 1, format: SaveFormat.JPEG }, // 압축률은 토큰 사용량과 차이 크게 안남
    );

    // 3. 리사이징된 이미지를 base64로 변환
    const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log("base64", base64);

    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error("이미지 전처리 오류:", error);
    // 전처리 실패 시 원본 base64 데이터 반환
    return base64Data ? `data:image/jpeg;base64,${base64Data}` : "";
  }
};

// 신분증 OCR 함수
export const extractIDCardInfo = async (
  base64Data?: string,
): Promise<IDCardOCRResult> => {
  try {
    if (!base64Data) {
      throw new Error("이미지 처리 실패");
    }

    // OpenAI API 호출
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "주민등록증 이미지에서 정보를 추출하여 지정된 JSON 형식으로만 응답하세요.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `이 신분증 이미지에서 다음 형식으로 정보를 추출하세요:
{
  "name": "",
  "registrationNumber": "",
  "address": "",
  "issueDate": "",
  "issuer": "",
  "isValid": true | false,
  "confidence": 0.95,
}
  `,
            },
            {
              type: "image_url",
              image_url: {
                url: base64Data,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0,
      response_format: { type: "json_object" },
    });

    // API 응답 처리
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("API 응답 없음");
    }

    // 토큰 사용량
    const usage = response.usage;
    console.log("토큰 사용량:", usage);

    try {
      // JSON 파싱
      const result: IDCardOCRResult = JSON.parse(content);

      return {
        ...result,
        imageBase64: base64Data, // 원본 이미지 base64 추가
        confidence: result.confidence || 0.8, // confidence가 없으면 기본값 설정
      };
    } catch (parseError) {
      console.error("JSON 파싱 오류:", parseError);

      // 파싱 오류 시 기본 결과 반환
      return {
        name: "",
        registrationNumber: "",
        address: "",
        issueDate: "",
        issuer: "",
        isValid: false,
        confidence: 0,
        imageBase64: base64Data || "",
        error:
          "JSON 파싱 오류: " +
          (parseError instanceof Error
            ? parseError.message
            : String(parseError)),
      };
    }
  } catch (error) {
    console.error("신분증 정보 추출 오류:", error);
    return {
      name: "",
      registrationNumber: "",
      address: "",
      issueDate: "",
      issuer: "",
      isValid: false,
      confidence: 0,
      imageBase64: base64Data || "",
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
};
