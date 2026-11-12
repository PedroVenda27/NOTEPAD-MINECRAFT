const { contextBridge, ipcRenderer } = require("electron");

// Ponte entre a nota (página) e o programa (janelas)
contextBridge.exposeInMainWorld("nota", {
  nova: () => ipcRenderer.send("nota:nova"),
  fechar: () => ipcRenderer.send("nota:fechar"),
  apagar: () => ipcRenderer.send("nota:apagar"),
  topo: () => ipcRenderer.invoke("nota:topo"),
  mover: (dx, dy) => ipcRenderer.send("nota:mover", dx, dy),
  redimensionar: (dx, dy) => ipcRenderer.send("nota:tamanho", dx, dy),
  recolher: (sim) => ipcRenderer.invoke("nota:recolher", sim),
});
