# Livro de Notas

Bloco de notas para Windows em estilo pixel, inspirado no livro e pena de um jogo de blocos. Cada nota é um livro pequeno que flutua no ambiente de trabalho, como um post-it.

## Funcionalidades

- **Notas tipo post-it**: janelas sem moldura que se arrastam pela barra de cima e mudam de tamanho pela pega no canto. A posição e o tamanho ficam guardados.
- **Várias notas**: o botão **+** (Ctrl+N) cria uma nota nova.
- **Páginas**: quando uma página enche, o texto passa sozinho para a seguinte.
- **Tarefas**: o botão ☑ (Ctrl+T) mostra uma lista de tarefas. Ao marcar uma como concluída, o texto fica riscado e aparece um aviso de conquista.
- **Capa animada**: o livro abre e fecha com uma animação. Fechado (Ctrl+Q), fica só o ícone no ecrã.
- **Sempre por cima**: o botão ▲ mantém a nota à frente das outras janelas.
- **Atalhos**: Ctrl+C/V/X/A/Z/Y, menu do botão direito e tamanho da letra com Ctrl + / Ctrl −. Carrega em F1 para ver todos.
- **Música**: o botão ♪ toca música em ciclo. Põe um ficheiro `C418 - Minecraft - Minecraft Volume Alpha.mp3` na pasta, ou escolhe outro ficheiro com o clique direito no ♪. A música não vem incluída por ter direitos de autor.

## Executar

Precisas do [Node.js](https://nodejs.org/).

```bash
npm install
npm start
```

## Criar o programa (.exe)

```bash
npm run build
```

O programa fica em `dist/Livro de Notas-win32-x64/Livro de Notas.exe`. Para funcionar, o `.exe` tem de ficar junto com os restantes ficheiros dessa pasta.

## Ficheiros

| Ficheiro | Para que serve |
|---|---|
| `livro-de-notas.html` | A nota: aspeto, páginas, tarefas, animações |
| `main.js` | O programa: janelas, posições, menus |
| `preload.js` | Ligação entre a nota e o programa |
| `capa.png`, `icone.ico` | Capa do livro e ícone do programa |

As notas ficam guardadas em `%APPDATA%\Livro de Notas`.
