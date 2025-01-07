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

  mainWindow.loadURL("http://localhost:3000"); // Next.js 서버 URL
});

ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  return result.filePaths[0];
});

ipcMain.handle("organize-photos", async (event, folderPath) => {
  const files = await fs.readdir(folderPath);
  const promises = files.map(async (file) => {
    const filePath = path.join(folderPath, file);
    const stat = await fs.stat(filePath);

    if (stat.isFile() && /\.(jpe?g|png)$/i.test(file)) {
      const metadata = await exiftool.read(filePath);
      const date =
        metadata.DateTimeOriginal || metadata.CreateDate || stat.birthtime;
      const dateFolder = path.join(
        folderPath,
        date.toISOString().split("T")[0]
      );

      await fs.ensureDir(dateFolder);
      await fs.move(filePath, path.join(dateFolder, file));
    }
  });

  await Promise.all(promises);
  return { success: true };
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
