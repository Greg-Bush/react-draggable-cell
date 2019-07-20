import * as React from 'react';
import { PanResponder, View, ViewProps } from 'react-native';
import { animated, Spring } from 'react-spring/renderprops-native';

const AnimatedView: typeof View = animated(View);

interface IDimensions {
  width: number;
  height: number;
}
interface ICoordinates {
  left: number;
  top: number;
}
type DraggableDimensions = IDimensions & ICoordinates;
interface IGrid {
  columnsCount: number;
  rowsCount: number;
  cellWidth: number;
  cellHeight: number;
}

interface IDraggableViewProps extends DraggableDimensions, IGrid {
  style?: ViewProps;
  onDragStart: () => void;
  onDragEnd: (coordinates: ICoordinates) => void;
}

// TODO: Coordinates state refactoring
type DraggableViewState = ICoordinates;

export default class DraggableView extends
  React.Component<IDraggableViewProps, DraggableViewState> {
  public static getDerivedStateFromProps(props: IDraggableViewProps) {
    const { top, left } = props;
    return { top, left };
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
      // TODO: onMove prop with previous and current row and column indexes
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
  private area: IDimensions;
  constructor(props: IDraggableViewProps) {
    super(props);
    this.area = computeArea(props);
  }
  public componentDidUpdate(prevProps: IDraggableViewProps, prevState: DraggableViewState) {
    this.area = computeArea(this.props);
  }
  public render() {
    const { top, left } = this.state;
    const { width, height } = this.props;
    return (
      <Spring native={true} to={{ top, left, width, height }}>
        {
          (springProps: DraggableDimensions) => (
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
    const maxValue = this.area.height - this.props.height;
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
    const maxValue = this.area.width - this.props.width;
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
    const args = { top, left };
    this.setState(args);
    this.props.onDragEnd(args);
  }
}

const computeArea = (gridProps: IGrid): IDimensions => {
  const { cellHeight, cellWidth, columnsCount, rowsCount } = gridProps;
  return {
    height: cellHeight * rowsCount,
    width: cellWidth * columnsCount,
  };
};

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
