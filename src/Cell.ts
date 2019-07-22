import { IGrid } from "./IGrid";
import Draggable from "./Draggable";

export interface ICellLocation {
  column: number;
  row: number;
}

export default class Cell implements ICellLocation {
  public column: number;
  public row: number;
  public leftMin: number;
  public leftMax: number;
  public topMin: number;
  public topMax: number;
  constructor(grid: IGrid, location: ICellLocation) {
    this.column = location.column;
    this.row = location.row;
    this.leftMin = grid.cellWidth * location.column;
    this.leftMax = grid.cellWidth * (location.column + 1);
    this.topMin = grid.cellHeight * location.row;
    this.topMax = grid.cellHeight * (location.row + 1);
  }
  public isTouched(draggable: Draggable): boolean {
    return (
      this.topMin <= draggable.top && draggable.top < this.topMax ||
      this.topMax >= draggable.topMax && draggable.topMax > this.topMin ||
      this.topMin > draggable.top && this.topMax < draggable.topMax
    ) &&
      (
        this.leftMin <= draggable.left && draggable.left < this.leftMax ||
        this.leftMax >= draggable.leftMax && draggable.leftMax > this.leftMin ||
        this.leftMin > draggable.left && this.leftMax < draggable.leftMax
      );
  }
}
