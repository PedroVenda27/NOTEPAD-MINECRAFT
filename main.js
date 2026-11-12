const { app, BrowserWindow, ipcMain, screen, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

// Cada nota é uma janela pequena, sem moldura, que se arrasta pelo ecrã (estilo post-it).
// A lista de notas (posição, tamanho, "sempre por cima", recolhida) fica em notas.json.

const ABERTO = { w: 360, h: 500 };     // tamanho por omissão de uma nota aberta
const RECOLHIDO = { w: 120, h: 112 };  // tamanho quando está recolhida (só o ícone do livro)
const MIN = { w: 280, h: 360 };

const ficheiro = () => path.join(app.getPath("userData"), "notas.json");
let notas = [];
const janelas = new Map(); // id -> BrowserWindow

function carregar() {
  try {
    notas = JSON.parse(fs.readFileSync(ficheiro(), "utf8")).notas || [];
  } catch {
    notas = [];
  }
}

let temporizador = null;
function guardar() {
  clearTimeout(temporizador);
  temporizador = setTimeout(guardarJa, 300);
}
function guardarJa() {
  clearTimeout(temporizador);
  try {
    fs.writeFileSync(ficheiro(), JSON.stringify({ notas }, null, 2));
  } catch (e) {
    console.error("Erro ao guardar notas.json", e);
  }
}

const notaDe = (win) => win && notas.find((n) => n.id === win.notaId);

// Garante que a nota aparece num ecrã que existe (ex.: se desligaste um monitor)
function posicaoValida(x, y) {
  if (x == null || y == null) return false;
  return screen.getAllDisplays().some(({ workArea: a }) =>
    x >= a.x - 50 && y >= a.y - 10 && x < a.x + a.width - 60 && y < a.y + a.height - 60);
}

function abrirNota(n) {
  if (janelas.has(n.id)) {
    const w = janelas.get(n.id);
    w.show();
    w.focus();
    return w;
  }
  const tam = n.recolhido ? RECOLHIDO : { w: n.w || ABERTO.w, h: n.h || ABERTO.h };
  const opcoes = {
    width: tam.w,
    height: tam.h,
    frame: false,
    transparent: true,
    resizable: false,        // o tamanho muda-se pela pega no canto da nota
    hasShadow: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: !!n.topo,
    title: "Livro de Notas",
    icon: path.join(__dirname, "icone.ico"),
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      backgroundThrottling: false,   // animações e gravação continuam mesmo com a nota tapada
    },
  };
  if (posicaoValida(n.x, n.y)) {
    opcoes.x = n.x;
    opcoes.y = n.y;
  }
  const win = new BrowserWindow(opcoes);
  win.notaId = n.id;
  janelas.set(n.id, win);
  win.loadFile(path.join(__dirname, "livro-de-notas.html"), {
    query: { id: n.id, topo: n.topo ? "1" : "0", recolhido: n.recolhido ? "1" : "0" },
  });
  win.on("move", () => {
    const [x, y] = win.getPosition();
    n.x = x;
    n.y = y;
    guardar();
  });
  win.on("closed", () => janelas.delete(n.id));

  // Menu do botão direito (copiar, colar, etc.)
  win.webContents.on("context-menu", (_e, p) => {
    const ed = p.editFlags;
    const itens = [];
    if (p.isEditable) {
      itens.push(
        { label: "Desfazer", accelerator: "Ctrl+Z", role: "undo", enabled: ed.canUndo },
        { label: "Refazer", accelerator: "Ctrl+Y", role: "redo", enabled: ed.canRedo },
        { type: "separator" },
        { label: "Cortar", accelerator: "Ctrl+X", role: "cut", enabled: ed.canCut },
        { label: "Copiar", accelerator: "Ctrl+C", role: "copy", enabled: ed.canCopy },
        { label: "Colar", accelerator: "Ctrl+V", role: "paste", enabled: ed.canPaste },
        { label: "Apagar", role: "delete", enabled: ed.canDelete },
        { type: "separator" },
        { label: "Selecionar tudo", accelerator: "Ctrl+A", role: "selectAll" },
      );
    } else if (p.selectionText) {
      itens.push({ label: "Copiar", accelerator: "Ctrl+C", role: "copy" });
    }
    if (p.misspelledWord && p.dictionarySuggestions.length) {
      itens.unshift(
        ...p.dictionarySuggestions.slice(0, 4).map((s) => ({ label: s, click: () => win.webContents.replaceMisspelling(s) })),
        { type: "separator" },
      );
    }
    if (itens.length) Menu.buildFromTemplate(itens).popup({ window: win });
  });
  return win;
}

// Menu invisível (as notas não têm moldura) só para os atalhos de teclado funcionarem sempre
function criarMenuAtalhos() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: "Editar",
      submenu: [
        { label: "Desfazer", role: "undo", accelerator: "Ctrl+Z" },
        { label: "Refazer", role: "redo", accelerator: "Ctrl+Y" },
        { label: "Refazer", role: "redo", accelerator: "Ctrl+Shift+Z", visible: false, acceleratorWorksWhenHidden: true },
        { type: "separator" },
        { label: "Cortar", role: "cut", accelerator: "Ctrl+X" },
        { label: "Copiar", role: "copy", accelerator: "Ctrl+C" },
        { label: "Colar", role: "paste", accelerator: "Ctrl+V" },
        { label: "Colar sem formatação", role: "pasteAndMatchStyle", accelerator: "Ctrl+Shift+V" },
        { label: "Selecionar tudo", role: "selectAll", accelerator: "Ctrl+A" },
      ],
    },
    {
      label: "Ver",
      submenu: [
        { label: "Aumentar letra", role: "zoomIn", accelerator: "Ctrl+=" },
        { label: "Aumentar letra", role: "zoomIn", accelerator: "Ctrl+Plus", visible: false, acceleratorWorksWhenHidden: true },
        { label: "Diminuir letra", role: "zoomOut", accelerator: "Ctrl+-" },
        { label: "Tamanho normal", role: "resetZoom", accelerator: "Ctrl+0" },
      ],
    },
  ]));
}

function novaNota(origem) {
  const n = { id: Date.now().toString(36), w: ABERTO.w, h: ABERTO.h };
  if (origem) {
    const [x, y] = origem.getPosition();
    n.x = x + 30;
    n.y = y + 30;
  }
  notas.push(n);
  guardar();
  abrirNota(n);
}

// ---------- Pedidos vindos das notas ----------
const janelaDe = (e) => BrowserWindow.fromWebContents(e.sender);

ipcMain.on("nota:nova", (e) => novaNota(janelaDe(e)));

ipcMain.on("nota:fechar", (e) => janelaDe(e)?.close());

ipcMain.on("nota:apagar", (e) => {
  const win = janelaDe(e);
  notas = notas.filter((n) => n.id !== win.notaId);
  guardarJa();
  win.close();
});

ipcMain.handle("nota:topo", (e) => {
  const win = janelaDe(e);
  const n = notaDe(win);
  n.topo = !n.topo;
  win.setAlwaysOnTop(n.topo);
  guardar();
  return n.topo;
});

ipcMain.on("nota:mover", (e, dx, dy) => {
  const win = janelaDe(e);
  const [x, y] = win.getPosition();
  win.setPosition(Math.round(x + dx), Math.round(y + dy));
});

ipcMain.on("nota:tamanho", (e, dx, dy) => {
  const win = janelaDe(e);
  const n = notaDe(win);
  if (n.recolhido) return;
  const [w, h] = win.getSize();
  n.w = Math.max(MIN.w, Math.round(w + dx));
  n.h = Math.max(MIN.h, Math.round(h + dy));
  win.setSize(n.w, n.h);
  guardar();
});

ipcMain.handle("nota:recolher", (e, sim) => {
  const win = janelaDe(e);
  const n = notaDe(win);
  n.recolhido = !!sim;
  if (sim) {
    win.setSize(RECOLHIDO.w, RECOLHIDO.h);
  } else {
    const w = n.w || ABERTO.w, h = n.h || ABERTO.h;
    // ao abrir, não deixar a nota sair do ecrã
    const [x, y] = win.getPosition();
    const a = screen.getDisplayMatching({ x, y, width: w, height: h }).workArea;
    const nx = Math.min(Math.max(x, a.x), a.x + a.width - w);
    const ny = Math.min(Math.max(y, a.y), a.y + a.height - h);
    win.setBounds({ x: nx, y: ny, width: w, height: h });
  }
  guardar();
  return n.recolhido;
});

// ---------- Arranque ----------
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  // Abrir o programa outra vez volta a mostrar todas as notas (também as que fechaste com ×)
  app.on("second-instance", () => notas.forEach(abrirNota));

  app.whenReady().then(() => {
    criarMenuAtalhos();
    carregar();
    // "principal" usa as notas que já tinhas escrito antes
    if (!notas.length) notas.push({ id: "principal", w: ABERTO.w, h: ABERTO.h });
    guardarJa();
    notas.forEach(abrirNota);
  });

  app.on("window-all-closed", () => {
    guardarJa();
    app.quit();
  });
}
