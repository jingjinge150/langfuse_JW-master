import { Langfuse } from "langfuse";

const publicKey = import.meta.env.VITE_LANGFUSE_PUBLIC_KEY;
const secretKey = import.meta.env.VITE_LANGFUSE_SECRET_KEY;
// 환경변수가 없으면 빈 문자열 사용 (프록시)
const baseUrl = import.meta.env.VITE_LANGFUSE_BASE_URL || "";

if (!publicKey || !secretKey) {
  console.error(
    "Langfuse PUBLIC_KEY 또는 SECRET_KEY가 설정되지 않았습니다. .env 파일을 확인하세요."
  );
}

// 개발 모드에서 설정 확인
if (import.meta.env.DEV) {
  console.log("Langfuse 설정:", {
    baseUrl: baseUrl || "(프록시 사용 - /api 경로)",
    publicKey: publicKey ? `${publicKey.slice(0, 10)}...` : "undefined",
    secretKey: secretKey ? "설정됨" : "undefined",
  });
}

export const langfuse = new Langfuse({
  publicKey,
  secretKey,
  baseUrl,
});
