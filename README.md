
# 포토플로우 사용법

* **Windows용 앱 빌드 명령어:**

    ```bash
    npm run electron:build:win
    ```

* **Windows용 앱 확장자:**

    * `.exe` (NSIS 설치 프로그램)
    * `.exe` (포터블 실행 파일)
    * `.zip` (압축 파일)

* **모든 플랫폼용 빌드 명령어 (크로스 플랫폼 빌드):**

    ```bash
    npm run electron:build:all
    ```

* **빌드 결과물 위치:** 빌드된 파일은 `dist` 폴더에 저장됩니다.
* **Windows 빌드 옵션 확장:** 제안된 변경사항을 적용하면 NSIS 설치 프로그램, 포터블 실행 파일, ZIP 파일 등 다양한 형식의 Windows 앱 파일이 생성됩니다.

하지만 가장 안정적인 방법은 Windows 컴퓨터에서 Windows용 앱을 빌드하는 것입니다. macOS에서 Windows용 앱을 빌드할 경우 일부 기능이 제대로 작동하지 않을 수 있습니다.





## 크로스 플랫폼 빌드 제한사항 및 개선

macOS에서 Windows용 앱을 빌드할 때 몇 가지 제한사항이 있습니다.

* **코드 서명 불가능:** macOS에서 Windows용 앱을 빌드하면 코드 서명이 불가능합니다.
* **네이티브 모듈 문제:** 일부 네이티브 모듈이 제대로 작동하지 않을 수 있습니다.

따라서 가장 좋은 방법은 각 플랫폼에서 해당 플랫폼용 앱을 빌드하는 것입니다. 즉, Windows 앱은 Windows 컴퓨터에서 빌드하는 것이 가장 안정적입니다.

## Windows 빌드 옵션 확장

Windows 빌드에 대한 더 많은 옵션을 추가하려면 `package.json`을 다음과 같이 수정할 수 있습니다.

```json
{
  // ...
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      },
      {
        "target": "portable",
        "arch": ["x64"]
      },
      {
        "target": "zip",
        "arch": ["x64"]
      }
    ],
    "icon": "public/photoflow.png",
    "artifactName": "${productName}-${version}-${arch}.${ext}"
  },
  // ...
}
```

## 크로스 플랫폼 빌드 개선

macOS에서 Windows용 앱을 빌드하는 것이 가능은 하지만, 몇 가지 추가 설정이 필요합니다. 특히 `electron-builder`의 크로스 플랫폼 빌드 기능을 활용할 수 있습니다.

```json
{
  // ...
  "scripts": {
    "dev": "concurrently \"next dev\" \"electron .\"",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "fix-html": "node scripts/fix-html-paths.js",
    "electron:build": "rm -rf dist && npm run build && npm run fix-html && electron-builder --publish=never",
    "electron:build:mac": "rm -rf dist && npm run build && npm run fix-html && electron-builder --mac --publish=never",
    "electron:build:win": "rm -rf dist && npm run build && npm run fix-html && electron-builder --win --publish=never",
    "electron:build:linux": "rm -rf dist && npm run build && npm run fix-html && electron-builder --linux --publish=never",
    "electron:build:all": "rm -rf dist && npm run build && npm run fix-html && electron-builder -mwl --publish=never"
  },
  // ...
}
```
