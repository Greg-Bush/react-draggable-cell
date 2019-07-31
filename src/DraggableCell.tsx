import _ from 'lodash';
import * as React from 'react';
import { PanResponder, View, ViewProps } from 'react-native';
import { animated, Spring } from 'react-spring/renderprops-native';
import Cell from './Cell';
import Draggable from './Draggable';
import Grid from './Grid';
import { ICoordinates } from './ICoordinates';
import { IDimensions } from './IDimensions';
import { IGrid } from "./IGrid";

const AnimatedView: typeof View = animated(View);

interface IDraggableState extends ICoordinates {
  touchedCells: Cell[];
}
interface IOnMoveArgs {
  prev: IDraggableState;
  current: IDraggableState;
}
interface IDraggableCellProps extends IDimensions, ICoordinates, IGrid {
  style?: ViewProps;
  onDragStart: () => void;
  onDragEnd: (state: IOnMoveArgs) => void;
}
interface IDraggableCellState extends IDraggableState {
  grid: Grid;
  draggable: Draggable;
}

export default class DraggableCell extends
  React.Component<IDraggableCellProps, IDraggableCellState> {
  public constructor(props) {
    super(props);
    this.state = {
      touchedCells: [],
      left: 0,
      top: 0,
      grid: new Grid(props),
      draggable: new Draggable(props),
    };
  }
  public static getDerivedStateFromProps(props: IDraggableCellProps): IDraggableCellState {
    const { top, left } = props;
    const grid = new Grid(props);
    const draggable = new Draggable(props);
    return { top, left, grid, draggable, touchedCells: getTouchedCells(grid.cells, draggable) };
  }
  private _ref = React.createRef<View>();
  private get draggableRef() {
    if (this._ref.current) {
      return this._ref.current;
    }
    throw new Error('referred element not found');
  }
  private panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,

    onPanResponderGrant: () => {
      // The gesture has started. Show visual feedback so the user knows
      // what is happening!
      // gestureState.d{x,y} will be set to zero now
      this.props.onDragStart();
    },

    onPanResponderMove: (evt, gestureState) => {
      // The most recent move distance is gestureState.move{X,Y}
      // The accumulated gesture distance since becoming responder is
      // gestureState.d{x,y}
      const top = this.computeTopValue(gestureState.dy);
      const left = this.computeLeftValue(gestureState.dx);
      this.shift({ top, left });
    },
    onPanResponderTerminationRequest: () => true,
    onPanResponderRelease: (evt, gestureState) => {
      // The user has released all touches while this view is the
      // responder. This typically means a gesture has succeeded
      let top = this.computeTopValue(gestureState.dy);
      let left = this.computeLeftValue(gestureState.dx);

      top = stepAlign(top, this.props.width, this.props.cellWidth);
      left = stepAlign(left, this.props.height, this.props.cellHeight);

      this.onDragEnd({ left, top });
    },
    onPanResponderTerminate: (evt, gestureState) => {
      // Another component has become the responder, so this gesture
      // should be cancelled
      this.shift({});
    },
  });
  private get grid(): Grid {
    return this.state.grid;
  }
  private get draggable(): Draggable {
    return this.state.draggable;
  }
  public render() {
    const { top, left } = this.state;
    const { width, height } = this.props;
    return (
      <Spring native={true} to={{ top, left, width, height }}>
        {
          (springProps: IDimensions & ICoordinates) => (
            <AnimatedView
              ref={this._ref}
              style={[{
                position: 'absolute',
              }, springProps]}
              {...this.panResponder.panHandlers}
            >
              {
                this.props.children
              }
            </AnimatedView>
          )
        }
      </Spring>
    );
  }
  private computeTopValue(dy: number) {
    let top = this.state.top + dy;
    if (top < 0) {
      top = 0;
    }
    const maxValue = this.grid.area.height - this.props.height;
    if (top > maxValue) {
      top = maxValue;
    }
    return top;
  }
  private computeLeftValue(dx: number) {
    let left = this.state.left + dx;
    if (left < 0) {
      left = 0;
    }
    const maxValue = this.grid.area.width - this.props.width;
    if (left > maxValue) {
      left = maxValue;
    }
    return left;
  }
  private shift({
    top = this.state.top,
    left = this.state.left,
  }) {
    this.draggableRef.setNativeProps({
      style: { top, left },
    });
  }
  private onDragEnd({
    top = this.state.top,
    left = this.state.left,
  }) {
    const draggable = new Draggable({ top, left, ...this.props });
    const { grid } = this.state;
    const args = { top, left, draggable, touchedCells: getTouchedCells(grid.cells, draggable) };
    this.props.onDragEnd({
      prev: this.state,
      current: args,
    });
    this.setState({
      ...this.state,
      ...args,
    });
  }
}

const stepAlign = (coordinate: number, length: number, step: number) => {
  const end = coordinate + length;
  const startStepsCount = coordinate / step;
  const endStepsCount = end / step;
  const startIndex = Math.floor(startStepsCount);
  const endIndex = Math.floor(endStepsCount);
  if (endIndex === startIndex) {
    return coordinate;
  }
  const startStepsCountDecimalPart = startStepsCount - startIndex;
  const endStepsCountDecimalPart = endStepsCount - endIndex;
  if (
    Math.min(startStepsCountDecimalPart, 1 - startStepsCountDecimalPart) >
    Math.min(endStepsCountDecimalPart, 1 - endStepsCountDecimalPart)
  ) {
    const newEndIndex = Math.round(endStepsCount);
    return newEndIndex * step - length;
  }
  const newStartIndex = Math.round(startStepsCount);
  return newStartIndex * step;
};

const getTouchedCells = (cells: Cell[], draggable: Draggable) =>
  _.filter(cells, cell => cell.isTouched(draggable));
