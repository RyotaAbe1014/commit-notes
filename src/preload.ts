// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// レンダラープロセスに公開するAPI
contextBridge.exposeInMainWorld('api', {
  // ファイルシステム操作
  fs: {
    listFiles: (dirPath: string | null) => ipcRenderer.invoke('fs:list-files', dirPath),
    readFile: (filePath: string) => ipcRenderer.invoke('fs:read-file', filePath),
    writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:write-file', filePath, content),
    addFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:add-file', filePath, content),
    renameFile: (filePath: string, newName: string) => ipcRenderer.invoke('fs:rename-file', filePath, newName),
    removeFile: (filePath: string) => ipcRenderer.invoke('fs:remove-file', filePath),
    createDirectory: (dirPath: string) => ipcRenderer.invoke('fs:create-directory', dirPath),
    deleteDirectory: (dirPath: string) => ipcRenderer.invoke('fs:delete-directory', dirPath),
    renameDirectory: (dirPath: string, newName: string) => ipcRenderer.invoke('fs:rename-directory', dirPath, newName)
  },

  // Git操作
  git: {
    init: (repoPath: string) => ipcRenderer.invoke('git:init', repoPath),
    add: (repoPath: string, filepath: string) => ipcRenderer.invoke('git:add', repoPath, filepath),
    commit: (repoPath: string, message: string, author: { name: string, email: string }) =>
      ipcRenderer.invoke('git:commit', repoPath, message, author),
    push: (repoPath: string, remoteUrl: string, token: string) =>
      ipcRenderer.invoke('git:push', repoPath, remoteUrl, token),
    pull: (repoPath: string, remoteUrl: string, token: string) =>
      ipcRenderer.invoke('git:pull', repoPath, remoteUrl, token),
    status: (repoPath: string) => ipcRenderer.invoke('git:status', repoPath)
  }
});
