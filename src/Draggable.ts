import { ICoordinates } from './ICoordinates';
import { IDimensions } from './IDimensions';
export default class Draggable implements IDimensions, ICoordinates {
  public left: number;
  public top: number;
  public width: number;
  public height: number;
  public readonly leftMax: number;
  public readonly topMax: number;
  constructor({ top, left, width, height }: IDimensions & ICoordinates) {
    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
    this.leftMax = this.left + this.width;
    this.topMax = this.top + this.height;
  }
}
