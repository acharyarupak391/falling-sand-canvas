import { fabric } from "fabric";

const canvas = new fabric.Canvas("canvas", {
  width: 1000,
  height: 500,
  backgroundColor: "#eee",
  isDrawingMode: false,
  selection: false,
});

const GRID = {
  ROWS: 20,
  COLS: 40,
  SIZE: 20,
  LEFT: 50,
  TOP: 50,
};

const GRID_ARRAY = [];

function initializeGridArray() {
  Array.from({ length: GRID.ROWS }, (_, i) => {
    Array.from({ length: GRID.COLS }, (_, j) => {
      if (!GRID_ARRAY[i]) GRID_ARRAY[i] = [];
      GRID_ARRAY[i][j] = 0;
    });
  });
}
initializeGridArray();

function drawGrid() {
  const grid = new fabric.Group([], {
    selectable: false,
    subTargetCheck: true,
  });

  const { ROWS, COLS, SIZE, LEFT, TOP } = GRID;

  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      const left = j * SIZE + LEFT;
      const top = i * SIZE + TOP;

      const rect = new fabric.Rect({
        left,
        top,
        fill: "transparent",
        width: SIZE,
        height: SIZE,
        selectable: false,
        stroke: "black",
        strokeWidth: 1,
      });
      grid.addWithUpdate(rect);
    }
  }

  canvas.add(grid);
}
drawGrid();

// function to get the grid cell position based on the mouse click position
function getGridCellPosition(x, y) {
  const { SIZE, LEFT, TOP } = GRID;
  const col = Math.floor((x - LEFT) / SIZE);
  const row = Math.floor((y - TOP) / SIZE);

  if (GRID_ARRAY[row] && GRID_ARRAY[row][col] === 0) return { row, col };

  return { row: -1, col: -1 };
}

function fillCellByPosition(row, col) {
  if (GRID_ARRAY[row][col] === 1) return;

  const { SIZE, LEFT, TOP } = GRID;
  const left = col * SIZE + LEFT;
  const top = row * SIZE + TOP;

  const rect = new fabric.Rect({
    left,
    top,
    fill: "red",
    stroke: "black",
    width: SIZE,
    height: SIZE,
    selectable: false,
  });
  canvas.add(rect);

  animateCellToBottom(row, col, rect);
}

const SPEED = 1000;

/**
 * Animates a cell to the bottom of the grid.
 *
 * @param {number} row - The row index of the cell.
 * @param {number} col - The column index of the cell.
 * @param {fabric.Rect} sand - The sand to animate.
 */
function animateCellToBottom(row, col, sand) {
  animate(sand, row, col);
}

/**
 * Animates a sand to the bottom of the grid.
 *
 * @param {fabric.Rect} sand - The sand to animate.
 * @param {number} row - The row index of the sand.
 * @param {number} col - The column index of the sand.
 * @param {number} top - The top position of the sand.
 * @param {number} left - The left position of the sand.
 */
function animate(sand, row, col) {
  function getPoints(row, col) {
    if (row === GRID.ROWS - 1) {
      GRID_ARRAY[row][col] = 1;
      return;
    }

    let newCol = col;

    if (GRID_ARRAY[row + 1][col] === 1) {
      const belowRight = GRID_ARRAY[row + 1][col + 1];
      const belowLeft = GRID_ARRAY[row + 1][col - 1];

      if (belowRight === 0 && belowLeft === 0) {
        const randomRightOrLeft = Math.random() > 0.5 ? 1 : -1;
        newCol = col + randomRightOrLeft;
      } else if (belowRight === 0) newCol = col + 1;
      else if (belowLeft === 0) newCol = col - 1;
    }

    let newRow = row;

    let _found = false;
    GRID_ARRAY.map((row, i) => {
      if (_found) return;

      if (row[newCol] === 1) {
        _found = true;
        newRow = Math.max(i - 1, 0);
      }
    });

    if (!_found) newRow = GRID.ROWS - 1;

    if (newRow === row && newCol === col) {
      GRID_ARRAY[newRow][newCol] = 1;
      return;
    }

    const newTop = newRow * GRID.SIZE + GRID.TOP;
    const newLeft = newCol * GRID.SIZE + GRID.LEFT;

    return { newRow, newCol, newTop, newLeft };
  }

  const data = [];
  let points = getPoints(row, col);
  while (points) {
    const { newRow, newCol, newTop, newLeft } = points;
    data.push({ top: newTop, left: newLeft });

    points = getPoints(newRow, newCol);
  }

  function animateTopLeft(top, left) {
    const speed = sand.left - left === 0 ? SPEED : SPEED * 0.4;
    sand.animate(
      {
        top,
        left,
      },
      {
        duration: speed,
        onChange: canvas.renderAll.bind(canvas),
        onComplete: function () {
          if (data.length) {
            const point = data.shift();
            animateTopLeft(point.top, point.left);
          }
        },
      }
    );
  }

  const point = data.shift();
  if (point) animateTopLeft(point.top, point.left);
}

function handleMouseEvents() {
  let isMouseDown = false;

  canvas.on("mouse:down", function (event) {
    const { x, y } = event.pointer;
    const { row, col } = getGridCellPosition(x, y);

    if (row > -1 && col > -1) {
      isMouseDown = true;
      fillCellByPosition(row, col);
    }
  });

  canvas.on("mouse:move", function (event) {
    if (isMouseDown) {
      const { x, y } = event.pointer;
      const { row, col } = getGridCellPosition(x, y);

      if (row > -1 && col > -1) {
        fillCellByPosition(row, col);
      }
    }
  });

  canvas.on("mouse:up", function () {
    isMouseDown = false;
  });
}
handleMouseEvents();
