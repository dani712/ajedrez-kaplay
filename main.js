import kaplay from "https://unpkg.com/kaplay@latest/dist/kaplay.mjs";
import { Chess } from "https://unpkg.com/chess.js@latest/dist/esm/chess.js";

// ======================
// Init
// ======================

kaplay({
  width: 880,
  height: 640,
  background: [18, 18, 18],
});

const chess = new Chess();

const TILE = 80;
const BOARD_SIZE = 640;
const PANEL_X = 660;

let selectedSquare = null;
let pieces = {};
let highlights = [];
let moveTexts = [];
let checkHighlight = null;

// ======================
// Helpers
// ======================

function squareToCoord(square) {
  const file = square.charCodeAt(0) - 97;
  const rank = 8 - Number(square[1]);
  return vec2(file * TILE, rank * TILE);
}

function coordToSquare(pos) {
  if (pos.x > BOARD_SIZE) return null;
  const file = Math.floor(pos.x / TILE);
  const rank = 8 - Math.floor(pos.y / TILE);
  if (file < 0 || file > 7 || rank < 1 || rank > 8) return null;
  return String.fromCharCode(97 + file) + rank;
}

function pieceChar(piece) {
  const map = { p:"♟", r:"♜", n:"♞", b:"♝", q:"♛", k:"♚" };
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
      color(light ? rgb(240,217,181) : rgb(181,136,99)),
    ]);
  }
}

// ======================
// Pieces
// ======================

function drawPieces(animatedMove = null) {
  Object.values(pieces).forEach(destroy);
  pieces = {};

  chess.board().forEach((row, y) => {
    row.forEach((piece, x) => {
      if (!piece) return;

      const square = String.fromCharCode(97 + x) + (8 - y);
      const target = vec2(
        x * TILE + TILE / 2,
        y * TILE + TILE / 2
      );

      const isWhite = piece.color === "w";

      const p = add([
        text(pieceChar(piece), {
          size: 48,
          color: isWhite ? rgb(255, 255, 255) : rgb(0, 0, 0),
        }),
        outline(2, isWhite ? rgb(0, 0, 0) : rgb(255, 255, 255)),
        pos(target),
        anchor("center"),
        area(),
      ]);

      // animación si corresponde
      if (animatedMove && animatedMove.to === square) {
        const from = squareToCoord(animatedMove.from);
        p.pos = vec2(from.x + TILE / 2, from.y + TILE / 2);

        tween(
          p.pos,
          target,
          0.15,
          (v) => {
            p.pos = v;
          },
          easings.easeOutQuad
        );
      }


      pieces[square] = p;
    });
  });
}

// ======================
// Highlight logic
// ======================

function clearHighlights() {
  highlights.forEach(destroy);
  highlights = [];
  if (checkHighlight) {
    destroy(checkHighlight);
    checkHighlight = null;
  }
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
  chess.moves({ square, verbose: true }).forEach((m) => {
    highlightSquare(m.to, rgb(0,255,0), 0.35);
  });
}

function highlightKingInCheck() {
  if (!chess.isCheck()) return;

  const kingSquare = chess.board()
    .flatMap((row, y) =>
      row.map((p, x) =>
        p && p.type === "k" && p.color === chess.turn()
          ? String.fromCharCode(97 + x) + (8 - y)
          : null
      )
    )
    .find(Boolean);

  if (kingSquare) {
    const c = squareToCoord(kingSquare);
    checkHighlight = add([
      rect(TILE, TILE),
      pos(c),
      color(rgb(255, 0, 0)),
      opacity(0.4),
    ]);
  }
}

// ======================
// Side panel (turn + moves)
// ======================

const turnText = add([
  text("Turno: Blancas", { size: 20 }),
  pos(PANEL_X, 20),
]);

function updateTurn() {
  turnText.text = `Turno: ${chess.turn() === "w" ? "Blancas" : "Negras"}`;
}

function updateMoveList() {
  moveTexts.forEach(destroy);
  moveTexts = [];

  chess.history({ verbose: true }).forEach((m, i) => {
    const line = `${Math.floor(i / 2) + 1}. ${m.san}`;
    moveTexts.push(
      add([
        text(line, { size: 16 }),
        pos(PANEL_X, 60 + i * 18),
      ])
    );
  });
}

// ======================
// Initial render
// ======================

drawPieces();
updateTurn();
updateMoveList();
highlightKingInCheck();

// ======================
// Input
// ======================

onClick(() => {
  const square = coordToSquare(mousePos());
  if (!square) return;

  if (!selectedSquare) {
    const piece = chess.get(square);
    if (!piece || piece.color !== chess.turn()) return;

    selectedSquare = square;
    clearHighlights();
    highlightSquare(square, rgb(50,150,255), 0.5);
    showLegalMoves(square);
    return;
  }

  const move = chess.move({
    from: selectedSquare,
    to: square,
    promotion: "q",
  });

  selectedSquare = null;
  clearHighlights();

  if (!move) return;

  drawPieces(move);
  updateTurn();
  updateMoveList();
  highlightKingInCheck();

  if (chess.isCheckmate()) {
    alert("♚ JAQUE MATE ♚");
  }
});
