/* ============================================================
   MAZE LAB — maze.js
   Algorithms:
     • Generation : DFS Backtracking (recursive carve)
     • Solve BFS  : Breadth-First Search  → shortest path
     • Solve DFS  : Depth-First Search    → any valid path
   ============================================================ */

// ──────────────────────────────────────────────
// 1. CANVAS & STATE
// ──────────────────────────────────────────────
const canvas = document.getElementById("maze-canvas");
const ctx = canvas.getContext("2d");

// Cell types
const WALL = 0;
const PATH = 1;
const VISITED = 2;
const SOLUTION = 3;
const START = 4;
const END = 5;

// Colors (match CSS vars)
const COLORS = {
  [WALL]: "#0d111a",
  [PATH]: "#1a2235",
  [VISITED]: null, // set dynamically per algorithm
  [SOLUTION]: "#00ff8c",
  [START]: "#00e5ff",
  [END]: "#ff6b35",
};

// Global state
let grid = []; // 2D array of cell type
let ROWS = 21;
let COLS = 21;
let CELL_SIZE = 20;
let animDelay = 12; // ms per animation frame
let running = false;

// Start & end positions
let startCell = { r: 1, c: 1 };
let endCell = { r: ROWS - 2, c: COLS - 2 };

// ──────────────────────────────────────────────
// 2. DOM REFERENCES
// ──────────────────────────────────────────────
const btnGenerate = document.getElementById("btn-generate");
const btnBFS = document.getElementById("btn-bfs");
const btnDFS = document.getElementById("btn-dfs");
const btnReset = document.getElementById("btn-reset");
const sliderSize = document.getElementById("grid-size");
const sliderSpeed = document.getElementById("anim-speed");
const sizeDisplay = document.getElementById("size-display");
const speedDisplay = document.getElementById("speed-display");
const overlay = document.getElementById("maze-overlay");

const statStatus = document.getElementById("stat-status");
const statAlgo = document.getElementById("stat-algo");
const statVisited = document.getElementById("stat-visited");
const statPath = document.getElementById("stat-path");

// ──────────────────────────────────────────────
// 3. HELPERS
// ──────────────────────────────────────────────

/** Sleep for `ms` milliseconds (used for animation frames) */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Fisher-Yates shuffle of an array (in-place) */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Check if (r,c) is inside the grid */
function inBounds(r, c) {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS;
}

/** Encode (r,c) to a single key string */
function key(r, c) {
  return `${r},${c}`;
}

// ──────────────────────────────────────────────
// 4. CANVAS SETUP
// ──────────────────────────────────────────────

function setupCanvas() {
  // Fit canvas inside maze-area (max 640x640)
  const maxW = Math.min(window.innerWidth - 280, 680);
  const maxH = Math.min(window.innerHeight - 90, 680);
  CELL_SIZE = Math.floor(Math.min(maxW, maxH) / Math.max(ROWS, COLS));
  CELL_SIZE = Math.max(CELL_SIZE, 6);

  canvas.width = COLS * CELL_SIZE;
  canvas.height = ROWS * CELL_SIZE;
}

// ──────────────────────────────────────────────
// 5. DRAW FUNCTIONS
// ──────────────────────────────────────────────

function drawCell(r, c, type, visitColor) {
  let color = COLORS[type];
  if (type === VISITED) color = visitColor || "rgba(0,229,255,0.25)";
  ctx.fillStyle = color;
  ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);

  // Glow for solution path
  if (type === SOLUTION) {
    ctx.shadowColor = "#00ff8c";
    ctx.shadowBlur = 6;
    ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.shadowBlur = 0;
  }
  // Glow for start / end
  if (type === START) {
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 10;
    ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.shadowBlur = 0;
  }
  if (type === END) {
    ctx.shadowColor = "#ff6b35";
    ctx.shadowBlur = 10;
    ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.shadowBlur = 0;
  }
}

function drawFullGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      drawCell(r, c, grid[r][c]);
    }
  }
  // Always redraw start & end on top
  drawCell(startCell.r, startCell.c, START);
  drawCell(endCell.r, endCell.c, END);
}

// ──────────────────────────────────────────────
// 6. MAZE GENERATION — RANDOMIZED PRIM'S
// ──────────────────────────────────────────────
/*
  Prim's produces denser, harder mazes than DFS carving.
  More dead ends, more branching — solvers must actually work.
*/

function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      grid[r][c] = WALL;
    }
  }
}

// ── Randomized Prim's Algorithm ──────────────────
// Produces far denser, more complex mazes than DFS carving:
// - Grows the maze outward from many frontier points at once
// - Results in more dead ends, tighter corridors, more branching
// - Solvers have to work much harder to find the path
//
// How it works:
// 1. Start from (1,1), mark it PATH
// 2. Add all walls 2 steps away to a "frontier" list
// 3. Randomly pick a frontier entry — if the cell beyond it is
//    still WALL (unvisited), carve through and add its neighbors
// 4. Repeat until frontier is empty → fully connected maze
function carveMazePrim() {
  const dirs = [
    [-2, 0],
    [0, 2],
    [2, 0],
    [0, -2],
  ];

  // frontier entries: [wallR, wallC, destR, destC]
  // wallR/C = wall cell sitting between two maze cells
  // destR/C = the unvisited cell on the far side
  const frontier = [];

  function addFrontier(r, c) {
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc) && grid[nr][nc] === WALL) {
        frontier.push([r + dr / 2, c + dc / 2, nr, nc]);
      }
    }
  }

  // Seed from top-left cell
  grid[1][1] = PATH;
  addFrontier(1, 1);

  while (frontier.length > 0) {
    // Pick RANDOM frontier entry — this is what makes Prim's complex
    const idx = Math.floor(Math.random() * frontier.length);
    const [wr, wc, nr, nc] = frontier[idx];
    frontier.splice(idx, 1);

    if (grid[nr][nc] === WALL) {
      // only if destination still unvisited
      grid[wr][wc] = PATH; // knock down the wall between
      grid[nr][nc] = PATH; // open the destination cell
      addFrontier(nr, nc); // add its unvisited neighbors
    }
  }
}

function generateMaze() {
  if (running) return;

  const rawSize = parseInt(sliderSize.value);
  ROWS = rawSize % 2 === 0 ? rawSize + 1 : rawSize;
  COLS = ROWS;

  startCell = { r: 1, c: 1 };
  endCell = { r: ROWS - 2, c: COLS - 2 };

  setupCanvas();
  initGrid();
  carveMazePrim();

  drawFullGrid();
  overlay.classList.add("hidden");

  btnBFS.disabled = false;
  btnDFS.disabled = false;
  btnReset.disabled = false;

  setStatus("Ready", "—", "—", "—");
}

// ──────────────────────────────────────────────
// 7. SOLVE: BFS — Breadth-First Search
// ──────────────────────────────────────────────
/*
  BFS guarantees the SHORTEST path.
  Uses a queue (FIFO). Each cell records its parent for path reconstruction.
*/

async function solveBFS() {
  if (running) return;
  running = true;
  setButtons(false);
  setStatus("Running…", "BFS", 0, "—");

  const visitColor = "rgba(0,229,255,0.28)";

  // Reset grid to remove old solution visuals
  resetSolutionCells();

  const queue = [];
  const visited = new Set();
  const parent = {}; // key → parent key

  const startKey = key(startCell.r, startCell.c);
  const endKey = key(endCell.r, endCell.c);

  queue.push([startCell.r, startCell.c]);
  visited.add(startKey);

  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  let visitedCount = 0;
  let found = false;

  // BFS loop
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    const k = key(r, c);

    // Mark as visited (animate)
    if (k !== startKey && k !== endKey) {
      grid[r][c] = VISITED;
      drawCell(r, c, VISITED, visitColor);
      visitedCount++;
      statVisited.textContent = visitedCount;
      await sleep(animDelay);
    }

    if (k === endKey) {
      found = true;
      break;
    }

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      const nk = key(nr, nc);
      if (inBounds(nr, nc) && !visited.has(nk) && grid[nr][nc] !== WALL) {
        visited.add(nk);
        parent[nk] = k;
        queue.push([nr, nc]);
      }
    }
  }

  if (found) {
    const pathLen = await tracePath(parent, startKey, endKey);
    setStatus("Solved ✓", "BFS", visitedCount, pathLen);
  } else {
    setStatus("No path!", "BFS", visitedCount, "—");
  }

  running = false;
  setButtons(true);
}

// ──────────────────────────────────────────────
// 8. SOLVE: DFS — Recursive Backtracking
// ──────────────────────────────────────────────
/*
  True recursive DFS with backtracking:
  - Commits to ONE direction at a time (no pre-queuing all neighbors)
  - When stuck at a dead end, UNMARKS the cell (backtrack) — visible as
    the purple color disappearing, showing the algorithm retreating
  - Shuffles directions randomly so it never follows generation path
  - Finds any valid path, not necessarily shortest
*/

async function solveDFS() {
  if (running) return;
  running = true;
  setButtons(false);
  setStatus("Running…", "DFS", 0, "—");

  const visitColor = "rgba(192,132,252,0.35)";
  const backtrackColor = "rgba(192,132,252,0.08)"; // dim = backtracked cell

  resetSolutionCells();

  const startKey = key(startCell.r, startCell.c);
  const endKey = key(endCell.r, endCell.c);
  const visited = new Set();

  let visitedCount = 0;
  let found = false;
  // path tracks current recursion stack for solution reconstruction
  const currentPath = [];

  // Recursive async DFS — returns true if end is found
  async function dfsRecurse(r, c) {
    if (!running) return false; // abort if cancelled
    const k = key(r, c);

    visited.add(k);
    currentPath.push(k);

    // Animate visit (color the cell purple)
    if (k !== startKey && k !== endKey) {
      grid[r][c] = VISITED;
      drawCell(r, c, VISITED, visitColor);
      visitedCount++;
      statVisited.textContent = visitedCount;
      await sleep(animDelay);
    }

    // Base case: reached the end
    if (k === endKey) return true;

    // Try each direction in a NEW random order (key fix)
    const dirs = shuffle([
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ]);
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      const nk = key(nr, nc);

      if (inBounds(nr, nc) && !visited.has(nk) && grid[nr][nc] !== WALL) {
        const result = await dfsRecurse(nr, nc);
        if (result) return true; // solution found down this branch
      }
    }

    // ── BACKTRACK ──
    // Dead end — unmark this cell visually so user sees the retreat
    currentPath.pop();
    if (k !== startKey && k !== endKey) {
      grid[r][c] = PATH; // reset to plain path
      // Draw a dim tint to show "we were here but retreated"
      ctx.fillStyle = backtrackColor;
      ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      await sleep(Math.max(animDelay * 0.5, 1));
    }

    return false;
  }

  found = await dfsRecurse(startCell.r, startCell.c);

  if (found) {
    // currentPath holds the exact solution route — draw it directly
    for (const k of currentPath) {
      const [r, c] = k.split(",").map(Number);
      if (k !== startKey && k !== endKey) {
        grid[r][c] = SOLUTION;
        drawCell(r, c, SOLUTION);
        await sleep(Math.max(animDelay * 0.6, 8));
      }
    }
    drawCell(startCell.r, startCell.c, START);
    drawCell(endCell.r, endCell.c, END);
    setStatus("Solved ✓", "DFS", visitedCount, currentPath.length);
  } else {
    setStatus("No path!", "DFS", visitedCount, "—");
  }

  running = false;
  setButtons(true);
}

// ──────────────────────────────────────────────
// 9. PATH RECONSTRUCTION & ANIMATION
// ──────────────────────────────────────────────

async function tracePath(parent, startKey, endKey) {
  // Reconstruct path from end → start via parent map
  const path = [];
  let cur = endKey;

  while (cur && cur !== startKey) {
    path.push(cur);
    cur = parent[cur];
  }
  path.push(startKey);
  path.reverse();

  // Animate the solution path
  for (const k of path) {
    const [r, c] = k.split(",").map(Number);
    if (k !== startKey && k !== endKey) {
      grid[r][c] = SOLUTION;
      drawCell(r, c, SOLUTION);
      await sleep(Math.max(animDelay * 0.6, 8));
    }
  }
  // Redraw start & end on top
  drawCell(startCell.r, startCell.c, START);
  drawCell(endCell.r, endCell.c, END);

  return path.length;
}

// ──────────────────────────────────────────────
// 10. RESET SOLUTION (keep maze, clear colors)
// ──────────────────────────────────────────────

function resetSolutionCells() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === VISITED || grid[r][c] === SOLUTION) {
        grid[r][c] = PATH;
        drawCell(r, c, PATH);
      }
    }
  }
  drawCell(startCell.r, startCell.c, START);
  drawCell(endCell.r, endCell.c, END);
}

function resetAll() {
  if (running) return;
  resetSolutionCells();
  setStatus("Ready", "—", "—", "—");
}

// ──────────────────────────────────────────────
// 11. UI HELPERS
// ──────────────────────────────────────────────

function setStatus(status, algo, visited, pathLen) {
  statStatus.textContent = status;
  statAlgo.textContent = algo;
  statVisited.textContent = visited;
  statPath.textContent = pathLen;
}

function setButtons(enable) {
  btnGenerate.disabled = !enable;
  btnBFS.disabled = !enable;
  btnDFS.disabled = !enable;
  btnReset.disabled = !enable;
}

// Slider: grid size
sliderSize.addEventListener("input", () => {
  let val = parseInt(sliderSize.value);
  if (val % 2 === 0) val += 1;
  sizeDisplay.textContent = `${val}×${val}`;
});

// Slider: animation speed
const SPEED_LABELS = ["Very Slow", "Slow", "Normal", "Fast", "Very Fast"];
const SPEED_DELAYS = [80, 35, 12, 4, 1];
sliderSpeed.addEventListener("input", () => {
  const idx = parseInt(sliderSpeed.value) - 1;
  animDelay = SPEED_DELAYS[idx];
  speedDisplay.textContent = SPEED_LABELS[idx];
});

// Button events
btnGenerate.addEventListener("click", generateMaze);
btnBFS.addEventListener("click", solveBFS);
btnDFS.addEventListener("click", solveDFS);
btnReset.addEventListener("click", resetAll);

// ──────────────────────────────────────────────
// 12. INIT
// ──────────────────────────────────────────────

// Set initial display values
sizeDisplay.textContent = `21×21`;
speedDisplay.textContent = "Normal";

// Initial canvas placeholder (just draw the bg)
setupCanvas();
ctx.fillStyle = "#0d111a";
ctx.fillRect(0, 0, canvas.width, canvas.height);
