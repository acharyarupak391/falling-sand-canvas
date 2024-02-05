import { fabric } from "fabric";
import sandImg from "./assets/sand.png";
import bgImg from "./assets/bg.webp";

const canvas = new fabric.Canvas("canvas", {
  width: 1000,
  height: 700,
  backgroundColor: "#eee",
  isDrawingMode: false,
  selection: false,
});

// set background image to the canvas
fabric.Image.fromURL(bgImg, function (bg) {
  bg.set({
    width: canvas.width,
    height: canvas.height,
    selectable: false,
    filters: [new fabric.Image.filters.Brightness({ brightness: 0.5 })],
  });

  canvas.setBackgroundImage(bg, canvas.renderAll.bind(canvas));
});

const GRID = {
  ROWS: 35, // height
  COLS: 50, // width
  SIZE: 20,
  LEFT: 0,
  TOP: 0,
};
const { SIZE, LEFT, TOP, ROWS, COLS } = GRID;
const OFFSET = SIZE / 2;

const GRID_ARRAY = [];

function initializeGridArray() {
  Array.from({ length: ROWS }, (_, i) => {
    Array.from({ length: COLS }, (_, j) => {
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

  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      const left = j * SIZE + LEFT;
      const top = i * SIZE + TOP;

      const rect = new fabric.Rect({
        left,
        top,
        // sand background color light yellow + dirt color
        fill: "transparent",
        width: SIZE,
        height: SIZE,
        selectable: false,
        stroke: "transparent",
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
  const col = Math.floor((x - LEFT) / SIZE);
  const row = Math.floor((y - TOP) / SIZE);

  if (GRID_ARRAY[row] && GRID_ARRAY[row][col] === 0) return { row, col };

  return { row: -1, col: -1 };
}

function fillCellByPosition(row, col) {
  if (GRID_ARRAY[row][col] === 1) return;

  const left = col * SIZE + LEFT + OFFSET;
  const top = row * SIZE + TOP + OFFSET;

  fabric.Image.fromURL(sandImg, function (sand) {
    sand.set({
      left,
      top,
      selectable: false,
      originX: "center",
      originY: "center",
    });

    sand.scaleToHeight(SIZE);
    sand.scaleToWidth(SIZE);

    canvas.add(sand);

    animate(sand, row, col);
  });
}

const SPEED = 1000;

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
    if (row === ROWS - 1) {
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

    if (!_found) newRow = ROWS - 1;

    if (newRow === row && newCol === col) {
      GRID_ARRAY[newRow][newCol] = 1;
      return;
    }

    const newTop = newRow * SIZE + TOP + OFFSET;
    const newLeft = newCol * SIZE + LEFT + OFFSET;

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
    const isMovingSideways = sand.left - left !== 0;
    const speed = !isMovingSideways ? SPEED : SPEED * 0.45;

    sand.animate(
      {
        top,
        left,
        angle: isMovingSideways ? sand.angle + 90 : sand.angle,
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
