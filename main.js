const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs-extra");
const { ExifTool } = require("exiftool-vendored");
const exiftool = new ExifTool();

let mainWindow;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // preload.js 경로
      contextIsolation: true, // true로 설정
      enableRemoteModule: false, // 보안 강화
      nodeIntegration: false, // false로 설정
    },
  });

  // mainWindow.loadURL("http://localhost:3000"); // Next.js 서버 URL
  mainWindow.loadFile(
    path.join(__dirname, "my-photo-organizer/.next", "index.html")
  );
});

// 재귀적으로 모든 파일 찾기
async function getAllFiles(dirPath, includeSubfolders) {
  const files = await fs.readdir(dirPath);
  let arrayOfFiles = [];

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = await fs.stat(filePath);

    if (stat.isDirectory() && includeSubfolders) {
      arrayOfFiles = arrayOfFiles.concat(
        await getAllFiles(filePath, includeSubfolders)
      );
    } else if (!stat.isDirectory()) {
      arrayOfFiles.push({
        path: filePath,
        stat: stat,
        originalDir: dirPath, // 원본 디렉토리 경로 저장
      });
    }
  }

  return arrayOfFiles;
}

// 파일 정리 함수들
const organizeByDate = async (metadata, stat, baseFolder) => {
  const date =
    metadata.DateTimeOriginal || metadata.CreateDate || stat.birthtime;
  const dateFolder = path.join(baseFolder, date.toISOString().split("T")[0]);
  await fs.ensureDir(dateFolder);
  return dateFolder;
};

const organizeByExtension = async (filePath, baseFolder) => {
  const ext =
    path.extname(filePath).toLowerCase().substring(1) || "no-extension";
  const extFolder = path.join(baseFolder, ext);
  await fs.ensureDir(extFolder);
  return extFolder;
};

const organizeByFilename = async (filePath, baseFolder) => {
  const filename = path.basename(filePath);
  const firstChar = filename.charAt(0).toUpperCase() || "#";
  const nameFolder = path.join(baseFolder, firstChar);
  await fs.ensureDir(nameFolder);
  return nameFolder;
};

// 중복 파일 처리 함수
async function getUniqueFilePath(targetPath) {
  if (!(await fs.pathExists(targetPath))) {
    return targetPath;
  }

  const ext = path.extname(targetPath);
  const basename = path.basename(targetPath, ext);
  const dir = path.dirname(targetPath);
  let counter = 1;
  let newPath = targetPath;

  // 동일한 파일명이 존재할 경우 자동으로 넘버링 (예: photo.jpg → photo_1.jpg, photo_2.jpg)
  while (await fs.pathExists(newPath)) {
    newPath = path.join(dir, `${basename}_${counter}${ext}`);
    counter++;
  }

  return newPath;
}

ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  return result.filePaths[0];
});

ipcMain.handle(
  "organize-photos",
  async (
    event,
    folderPath,
    organizationType = "date",
    includeSubfolders = false
  ) => {
    try {
      // 진행 상황 추적을 위한 카운터
      let stats = {
        total: 0,
        processed: 0,
        skipped: 0,
        errors: [],
      };

      // 모든 파일 목록 가져오기
      const allFiles = await getAllFiles(folderPath, includeSubfolders);
      stats.total = allFiles.length;

      // 지원하는 파일 형식 정규식
      const supportedFiles =
        /\.(jpe?g|png|gif|tiff|bmp|webp|heic|mp4|mov|avi|wmv)$/i;

      const promises = allFiles.map(
        async ({ path: filePath, stat, originalDir }) => {
          try {
            const file = path.basename(filePath);

            if (supportedFiles.test(file)) {
              const metadata = await exiftool.read(filePath);
              let targetFolder;

              // 대상 폴더 결정
              switch (organizationType) {
                case "date":
                  targetFolder = await organizeByDate(
                    metadata,
                    stat,
                    folderPath
                  );
                  break;
                case "extension":
                  targetFolder = await organizeByExtension(
                    filePath,
                    folderPath
                  );
                  break;
                case "filename":
                  targetFolder = await organizeByFilename(filePath, folderPath);
                  break;
                default:
                  targetFolder = folderPath;
              }

              // 중복 처리된 최종 경로 얻기
              const targetPath = await getUniqueFilePath(
                path.join(targetFolder, file)
              );

              // 파일 이동
              await fs.move(filePath, targetPath, { overwrite: false });
              stats.processed++;

              return {
                file,
                success: true,
                from: originalDir,
                to: targetFolder,
              };
            } else {
              stats.skipped++;
              return null;
            }
          } catch (error) {
            stats.errors.push({
              file: path.basename(filePath),
              error: error.message,
            });
            return null;
          }
        }
      );

      const results = (await Promise.all(promises)).filter(Boolean);

      // 빈 폴더 정리 (하위 폴더 포함 옵션일 때만)
      if (includeSubfolders) {
        try {
          const cleanEmptyFoldersRecursively = async (dirPath) => {
            const isDirectory = (await fs.stat(dirPath)).isDirectory();
            if (!isDirectory) return;

            let files = await fs.readdir(dirPath);

            for (let file of files) {
              const fullPath = path.join(dirPath, file);
              if ((await fs.stat(fullPath)).isDirectory()) {
                await cleanEmptyFoldersRecursively(fullPath);
              }
            }

            files = await fs.readdir(dirPath);
            if (files.length === 0 && dirPath !== folderPath) {
              await fs.remove(dirPath);
            }
          };

          await cleanEmptyFoldersRecursively(folderPath);
        } catch (error) {
          console.error("Error cleaning empty folders:", error);
        }
      }

      return {
        success: true,
        organized: results,
        processedCount: stats.processed,
        skippedCount: stats.skipped,
        totalCount: stats.total,
        errors: stats.errors.length > 0 ? stats.errors : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
);

ipcMain.handle("get-organization-options", () => {
  return [
    { value: "date", label: "날짜별 정리" },
    { value: "extension", label: "확장자별 정리" },
    { value: "filename", label: "파일명별 정리" },
  ];
});

// 앱 종료 시 리소스 정리
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    exiftool.end();
    app.quit();
  }
});

// 예기치 않은 에러 처리
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
});
