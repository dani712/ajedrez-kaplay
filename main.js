import kaplay from "https://unpkg.com/kaplay@latest/dist/kaplay.mjs";
import { Chess } from "https://unpkg.com/chess.js@latest/dist/esm/chess.js";


// Inicializar Kaplay
kaplay({
  width: 640,
  height: 640,
  background: [20, 20, 20],
});

// Motor de ajedrez
const chess = new Chess();

const TILE_SIZE = 80;
const BOARD_OFFSET = vec2(0, 0);

let selectedSquare = null;
let pieces = {};

// ======================
// Helpers
// ======================

function squareToPos(square) {
  const file = square.charCodeAt(0) - 97; // a-h → 0-7
  const rank = 8 - parseInt(square[1]);   // 8-1 → 0-7
  return vec2(
    BOARD_OFFSET.x + file * TILE_SIZE,
    BOARD_OFFSET.y + rank * TILE_SIZE
  );
}

function posToSquare(pos) {
  const file = Math.floor(pos.x / TILE_SIZE);
  const rank = 8 - Math.floor(pos.y / TILE_SIZE);
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
// Dibujar tablero
// ======================

for (let y = 0; y < 8; y++) {
  for (let x = 0; x < 8; x++) {
    const isLight = (x + y) % 2 === 0;
    add([
      rect(TILE_SIZE, TILE_SIZE),
      pos(x * TILE_SIZE, y * TILE_SIZE),
      color(isLight ? rgb(240, 217, 181) : rgb(181, 136, 99)),
      area(),
      {
        square: String.fromCharCode(97 + x) + (8 - y),
      },
    ]);
  }
}

// ======================
// Dibujar piezas
// ======================

function drawPieces() {
  // borrar piezas viejas
  for (const k in pieces) destroy(pieces[k]);
  pieces = {};

  chess.board().forEach((row, y) => {
    row.forEach((piece, x) => {
      if (!piece) return;
      const square =
        String.fromCharCode(97 + x) + (8 - y);

      const p = add([
        text(pieceChar(piece), { size: 48 }),
        pos(
          x * TILE_SIZE + TILE_SIZE / 2,
          y * TILE_SIZE + TILE_SIZE / 2
        ),
        anchor("center"),
        area(),
        {
          square,
        },
      ]);

      pieces[square] = p;
    });
  });
}

drawPieces();

// ======================
// Input con mouse
// ======================

onClick(() => {
  const mouse = mousePos();
  const square = posToSquare(mouse);
  if (!square) return;

  if (!selectedSquare) {
    const piece = chess.get(square);
    if (piece && piece.color === chess.turn()) {
      selectedSquare = square;
    }
    return;
  }

  // Intentar mover
  const move = chess.move({
    from: selectedSquare,
    to: square,
    promotion: "q",
  });

  selectedSquare = null;

  if (!move) return;

  drawPieces();

  // Estado del juego
  if (chess.in_checkmate()) {
    alert("♚ JAQUE MATE ♚");
  } else if (chess.in_check()) {
    alert("⚠️ JAQUE");
  }
});
