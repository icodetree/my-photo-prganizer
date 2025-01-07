const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  organizePhotos: (folderPath) =>
    ipcRenderer.invoke("organize-photos", folderPath),
});
