// preload.js의 역할을 설명
// 보안 브리지 역할: 보안상의 이유로 메인 프로세스와 렌더러 프로세스 사이의 통신을 안전하게 중계합니다
// API 노출: 렌더러 프로세스(프론트엔드)에서 사용할 수 있는 API를 정의하고 노출시킵니다
// contextIsolation을 통해 메인 프로세스의 Node.js 기능들을 안전하게 제한합니다

// contextBridge: 메인 프로세스와 렌더러 프로세스 사이의 안전한 통신 브리지를 제공
// ipcRenderer: 렌더러 프로세스에서 메인 프로세스로 메시지를 보내는 모듈
const { contextBridge, ipcRenderer } = require("electron");

// "electronAPI"라는 이름으로 프론트엔드에서 접근 가능한 API를 노출
// 프론트엔드에서는 window.electronAPI로 접근 가능
contextBridge.exposeInMainWorld("electronAPI", {
  // 폴더 선택 다이얼로그를 여는 기능
  // 프론트엔드에서 window.electronAPI.selectFolder()로 호출
  selectFolder: () => ipcRenderer.invoke("select-folder"),

  // 파일 정리 기능 - 정렬 옵션을 파라미터로 받아 처리, 기본값은 "date"로 설정
  organizePhotos: (
    folderPath,
    organizationType = "date",
    includeSubfolders = false
  ) =>
    ipcRenderer.invoke(
      "organize-photos",
      folderPath,
      organizationType,
      includeSubfolders
    ),

  // 정렬 옵션 목록 가져오기 -  프론트엔드에서 선택 옵션을 표시할 때 사용
  getOrganizationOptions: () => ipcRenderer.invoke("get-organization-options"),
});
