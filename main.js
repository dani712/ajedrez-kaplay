import kaplay from "https://unpkg.com/kaplay@latest/dist/kaplay.mjs";
import { Chess } from "https://unpkg.com/chess.js@latest/dist/esm/chess.js";

// ======================
// Init
// ======================

kaplay({
  width: 640,
  height: 640,
  background: [20, 20, 20],
});

const chess = new Chess();

const TILE = 80;

let selectedSquare = null;
let pieces = {};
let highlights = [];

// ======================
// Helpers
// ======================

function squareToCoord(square) {
  const file = square.charCodeAt(0) - 97;
  const rank = 8 - Number(square[1]);
  return vec2(file * TILE, rank * TILE);
}

function coordToSquare(pos) {
  const file = Math.floor(pos.x / TILE);
  const rank = 8 - Math.floor(pos.y / TILE);
  if (file < 0 || file > 7 || rank < 1 || rank > 8) return null;
  return String.fromCharCode(97 + file) + rank;
}

function pieceChar(piece) {
  const map = {
    p: "♟",
    r: "♜",
    n: "♞",
    b: "♝",
    q: "♛",
    k: "♚",
  };
  return piece.color === "w"
    ? map[piece.type].toUpperCase()
    : map[piece.type];
}

// ======================
// Board
// ======================

for (let y = 0; y < 8; y++) {
  for (let x = 0; x < 8; x++) {
    const light = (x + y) % 2 === 0;
    add([
      rect(TILE, TILE),
      pos(x * TILE, y * TILE),
      color(light ? rgb(240, 217, 181) : rgb(181, 136, 99)),
    ]);
  }
}

// ======================
// Pieces
// ======================

function drawPieces() {
  Object.values(pieces).forEach(destroy);
  pieces = {};

  chess.board().forEach((row, y) => {
    row.forEach((piece, x) => {
      if (!piece) return;

      const square = String.fromCharCode(97 + x) + (8 - y);

      const p = add([
        text(pieceChar(piece), { size: 48 }),
        pos(x * TILE + TILE / 2, y * TILE + TILE / 2),
        anchor("center"),
        area(),
      ]);

      pieces[square] = p;
    });
  });
}

drawPieces();

// ======================
// Highlight logic
// ======================

function clearHighlights() {
  highlights.forEach(destroy);
  highlights = [];
}

function highlightSquare(square, col, alpha = 0.5) {
  const c = squareToCoord(square);
  const h = add([
    rect(TILE, TILE),
    pos(c),
    color(col),
    opacity(alpha),
  ]);
  highlights.push(h);
}

function showLegalMoves(square) {
  const moves = chess.moves({ square, verbose: true });
  moves.forEach((m) => {
    highlightSquare(m.to, rgb(0, 255, 0), 0.35);
  });
}

// ======================
// Input
// ======================

onClick(() => {
  const mouse = mousePos();
  const square = coordToSquare(mouse);
  if (!square) return;

  // No selección aún → intentar seleccionar
  if (!selectedSquare) {
    const piece = chess.get(square);
    if (!piece || piece.color !== chess.turn()) return;

    selectedSquare = square;
    clearHighlights();
    highlightSquare(square, rgb(50, 150, 255), 0.5);
    showLegalMoves(square);
    return;
  }

  // Intentar mover
  const move = chess.move({
    from: selectedSquare,
    to: square,
    promotion: "q",
  });

  selectedSquare = null;
  clearHighlights();

  if (!move) return;

  drawPieces();

  // Estado del juego
  if (chess.in_checkmate()) {
    alert("♚ JAQUE MATE ♚");
  } else if (chess.in_check()) {
    alert("⚠️ JAQUE");
  }
});
