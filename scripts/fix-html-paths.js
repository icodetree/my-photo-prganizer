// scripts/fix-html-paths.js
const fs = require("fs");
const path = require("path");

// out/index.html 파일 경로
const htmlFilePath = path.join(__dirname, "..", "out", "index.html");

console.log("HTML 파일 경로 수정 시작...");

try {
  // HTML 파일 읽기
  let htmlContent = fs.readFileSync(htmlFilePath, "utf8");

  // file:// 프로토콜에서 작동하도록 경로 수정
  // /_next/ 경로를 상대 경로로 변경
  htmlContent = htmlContent.replace(/\/_next\//g, "./_next/");

  // 수정된 내용 저장
  fs.writeFileSync(htmlFilePath, htmlContent);

  console.log("HTML 파일 경로 수정 완료!");
} catch (error) {
  console.error("HTML 파일 수정 중 오류 발생:", error);
  process.exit(1);
}
