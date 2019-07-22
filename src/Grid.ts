import Cell from './Cell';
import { IGrid } from './IGrid';

export default class Grid implements IGrid {
  public columnsCount: number;
  public rowsCount: number;
  public cellWidth: number;
  public cellHeight: number;
  public rows: Cell[][];
  public columns: Cell[][];
  public cells: Cell[];
  public readonly area = {
    height: this.cellHeight * this.rowsCount,
    width: this.cellWidth * this.columnsCount,
  };
  constructor({ cellHeight, cellWidth, columnsCount, rowsCount }: IGrid) {
    this.cellHeight = cellHeight;
    this.cellWidth = cellWidth;
    this.columnsCount = columnsCount;
    this.rowsCount = rowsCount;

    this.rows = new Array(rowsCount).fill(new Array(columnsCount));
    this.columns = new Array(columnsCount).fill(new Array(rowsCount));
    this.cells = new Array();
    for (let j = 0; j < rowsCount; j++) {
      for (let i = 0; i < columnsCount; i++) {
        const cell = new Cell(this, { column: i, row: j });
        this.rows[j][i] = cell;
        this.columns[i][j] = cell;
        this.cells.push(cell);
      }
    }
  }
}
