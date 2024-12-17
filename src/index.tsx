import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as cn from 'classnames';
import { Change } from 'diff';

import {
  computeLineInformation,
  LineInformation,
  DiffInformation,
  DiffType,
  DiffMethod,
} from './compute-lines';
import computeStyles, {
  ReactDiffViewerStyles,
  ReactDiffViewerStylesOverride,
} from './styles';

const m = require('memoize-one');

const memoize = m.default || m;

export enum LineNumberPrefix {
  LEFT = 'L',
  RIGHT = 'R',
}

export interface ReactDiffViewerProps {
  oldValue: string;
  newValue: string;
  noise: string[];
  splitView?: boolean;
  linesOffset?: number;
  disableWordDiff?: boolean;
  compareMethod?: DiffMethod | ((oldStr: string, newStr: string) => Change[]);
  extraLinesSurroundingDiff?: number;
  hideLineNumbers?: boolean;
  showDiffOnly?: boolean;
  renderContent?: (source: string) => JSX.Element;
  codeFoldMessageRenderer?: (
    totalFoldedLines: number,
    leftStartLineNumber: number,
    rightStartLineNumber: number,
  ) => JSX.Element;
  onLineNumberClick?: (
    lineId: string,
    event: React.MouseEvent<HTMLTableCellElement>,
  ) => void;
  renderGutter?: (data: {
    lineNumber: number;
    type: DiffType;
    prefix: LineNumberPrefix;
    value: string | DiffInformation[];
    additionalLineNumber: number;
    additionalPrefix: LineNumberPrefix;
    styles: ReactDiffViewerStyles;
    flattenPath: string; // Added flattenPath here
  }) => JSX.Element;
  highlightLines?: string[];
  styles?: ReactDiffViewerStylesOverride;
  useDarkTheme?: boolean;
  leftTitle?: string | JSX.Element;
  rightTitle?: string | JSX.Element;
}

export interface ReactDiffViewerState {
  expandedBlocks?: number[];
}

class DiffViewer extends React.Component<ReactDiffViewerProps, ReactDiffViewerState> {
  private styles: ReactDiffViewerStyles;

  public static defaultProps: ReactDiffViewerProps = {
    oldValue: '',
    newValue: '',
    noise: [],
    splitView: true,
    highlightLines: [],
    disableWordDiff: false,
    compareMethod: DiffMethod.CHARS,
    styles: {},
    hideLineNumbers: false,
    extraLinesSurroundingDiff: 3,
    showDiffOnly: true,
    useDarkTheme: false,
    linesOffset: 0,
  };

  public static propTypes = {
    oldValue: PropTypes.string.isRequired,
    newValue: PropTypes.string.isRequired,
    noise: PropTypes.arrayOf(PropTypes.string),
    splitView: PropTypes.bool,
    disableWordDiff: PropTypes.bool,
    compareMethod: PropTypes.oneOfType([PropTypes.oneOf(Object.values(DiffMethod)), PropTypes.func]),
    renderContent: PropTypes.func,
    onLineNumberClick: PropTypes.func,
    extraLinesSurroundingDiff: PropTypes.number,
    styles: PropTypes.object,
    hideLineNumbers: PropTypes.bool,
    showDiffOnly: PropTypes.bool,
    highlightLines: PropTypes.arrayOf(PropTypes.string),
    leftTitle: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    rightTitle: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    linesOffset: PropTypes.number,
  };

  public constructor(props: ReactDiffViewerProps) {
    super(props);

    this.state = {
      expandedBlocks: [],
    };
  }

  public resetCodeBlocks = (): boolean => {
    if (this.state.expandedBlocks.length > 0) {
      this.setState({
        expandedBlocks: [],
      });
      return true;
    }
    return false;
  };

  private onBlockExpand = (id: number): void => {
    const prevState = this.state.expandedBlocks.slice();
    prevState.push(id);

    this.setState({
      expandedBlocks: prevState,
    });
  };

  private computeStyles: (
    styles: ReactDiffViewerStylesOverride,
    useDarkTheme: boolean,
  ) => ReactDiffViewerStyles = memoize(computeStyles);

  private onLineNumberClickProxy = (id: string): any => {
    if (this.props.onLineNumberClick) {
      return (e: any): void => this.props.onLineNumberClick(id, e);
    }
    return (): void => {};
  };

  private renderWordDiff = (
    diffArray: DiffInformation[],
    renderer?: (chunk: string) => JSX.Element,
  ): JSX.Element[] => {
    return diffArray.map((wordDiff, i): JSX.Element => {
      return (
        <span
          key={i}
          className={cn(this.styles.wordDiff, {
            [this.styles.wordAdded]: wordDiff.type === DiffType.ADDED,
            [this.styles.wordRemoved]: wordDiff.type === DiffType.REMOVED,
            [this.styles.wordNoised]: wordDiff.type === DiffType.NOISED,
          })}
          data-flattenpath={wordDiff.flattenPath || ''}
        >
          {renderer ? renderer(wordDiff.value as string) : wordDiff.value}
        </span>
      );
    });
  };

  private renderLine = (
    lineNumber: number,
    type: DiffType,
    prefix: LineNumberPrefix,
    value: string | DiffInformation[],
    flattenPath?: string,
    additionalLineNumber?: number,
    additionalPrefix?: LineNumberPrefix,
  ): JSX.Element => {
    const lineNumberTemplate = `${prefix}-${lineNumber}`;
    const additionalLineNumberTemplate = `${additionalPrefix}-${additionalLineNumber}`;
    const highlightLine =
      this.props.highlightLines.includes(lineNumberTemplate) ||
      this.props.highlightLines.includes(additionalLineNumberTemplate);
    const added = type === DiffType.ADDED;
    const removed = type === DiffType.REMOVED;
    const noised = type === DiffType.NOISED;
    let content;
    if (Array.isArray(value)) {
      content = this.renderWordDiff(value, this.props.renderContent);
    } else if (this.props.renderContent) {
      content = this.props.renderContent(value);
    } else {
      content = value;
    }

    return (
      <React.Fragment>
        {!this.props.hideLineNumbers && (
          <td
            onClick={lineNumber && this.onLineNumberClickProxy(lineNumberTemplate)}
            className={cn(this.styles.gutter, {
              [this.styles.emptyGutter]: !lineNumber,
              [this.styles.diffAdded]: added,
              [this.styles.diffRemoved]: removed,
              [this.styles.diffNoised]: noised,
              [this.styles.highlightedGutter]: highlightLine,
            })}
            data-flattenpath={flattenPath || ''}
          >
            <pre className={this.styles.lineNumber}>{lineNumber}</pre>
          </td>
        )}
        {!this.props.splitView && !this.props.hideLineNumbers && (
          <td
            onClick={
              additionalLineNumber && this.onLineNumberClickProxy(additionalLineNumberTemplate)
            }
            className={cn(this.styles.gutter, {
              [this.styles.emptyGutter]: !additionalLineNumber,
              [this.styles.diffAdded]: added,
              [this.styles.diffRemoved]: removed,
              [this.styles.diffNoised]: noised,
              [this.styles.highlightedGutter]: highlightLine,
            })}
            data-flattenpath={flattenPath || ''}
          >
            <pre className={this.styles.lineNumber}>{additionalLineNumber}</pre>
          </td>
        )}
        {this.props.renderGutter
          ? this.props.renderGutter({
              lineNumber,
              type,
              prefix,
              value,
              additionalLineNumber,
              additionalPrefix,
              styles: this.styles,
              flattenPath: flattenPath || '', // Pass flattenPath here
            })
          : null}
        <td
          className={cn(this.styles.marker, {
            [this.styles.emptyLine]: !content,
            [this.styles.diffAdded]: added,
            [this.styles.diffRemoved]: removed,
            [this.styles.diffNoised]: noised,
            [this.styles.highlightedLine]: highlightLine,
          })}
          data-flattenpath={flattenPath || ''}
        >
          <pre>
            {added && '+'}
            {removed && '-'}
          </pre>
        </td>
        <td
          className={cn(this.styles.content, {
            [this.styles.emptyLine]: !content,
            [this.styles.diffAdded]: added,
            [this.styles.diffRemoved]: removed,
            [this.styles.diffNoised]: noised,
            [this.styles.highlightedLine]: highlightLine,
          })}
          data-flattenpath={flattenPath || ''}
        >
          <pre
            className={cn(this.styles.contentText, {
              [this.styles.wordNoised]: noised,
            })}
          >
            {content}
          </pre>
        </td>
      </React.Fragment>
    );
  };

  private renderSplitView = ({ left, right }: LineInformation, index: number): JSX.Element => {
    return (
      <tr key={index} className={this.styles.line}>
        {this.renderLine(
          left.lineNumber,
          left.type,
          LineNumberPrefix.LEFT,
          left.value,
          left.flattenPath,
        )}
        {this.renderLine(
          right.lineNumber,
          right.type,
          LineNumberPrefix.RIGHT,
          right.value,
          right.flattenPath,
        )}
      </tr>
    );
  };

  public renderInlineView = ({ left, right }: LineInformation, index: number): JSX.Element => {
    if (left.type === DiffType.REMOVED && right.type === DiffType.ADDED) {
      return (
        <React.Fragment key={index}>
          <tr className={this.styles.line}>
            {this.renderLine(
              left.lineNumber,
              left.type,
              LineNumberPrefix.LEFT,
              left.value,
              left.flattenPath,
            )}
          </tr>
          <tr className={this.styles.line}>
            {this.renderLine(
              null,
              right.type,
              LineNumberPrefix.RIGHT,
              right.value,
              right.flattenPath,
              right.lineNumber,
            )}
          </tr>
        </React.Fragment>
      );
    }

    let content;
    if (left.type === DiffType.REMOVED) {
      content = this.renderLine(
        left.lineNumber,
        left.type,
        LineNumberPrefix.LEFT,
        left.value,
        left.flattenPath,
        null,
      );
    }
    if (left.type === DiffType.DEFAULT) {
      content = this.renderLine(
        left.lineNumber,
        left.type,
        LineNumberPrefix.LEFT,
        left.value,
        left.flattenPath,
        right.lineNumber,
        LineNumberPrefix.RIGHT,
      );
    }
    if (right.type === DiffType.ADDED) {
      content = this.renderLine(
        null,
        right.type,
        LineNumberPrefix.RIGHT,
        right.value,
        right.flattenPath,
        right.lineNumber,
      );
    }

    return (
      <tr key={index} className={this.styles.line}>
        {content}
      </tr>
    );
  };

  private onBlockClickProxy =
    (id: number): any =>
    (): void =>
      this.onBlockExpand(id);

  private renderSkippedLineIndicator = (
    num: number,
    blockNumber: number,
    leftBlockLineNumber: number,
    rightBlockLineNumber: number,
  ): JSX.Element => {
    const { hideLineNumbers, splitView } = this.props;
    const message = this.props.codeFoldMessageRenderer ? (
      this.props.codeFoldMessageRenderer(num, leftBlockLineNumber, rightBlockLineNumber)
    ) : (
      <pre className={this.styles.codeFoldContent}>Expand {num} lines ...</pre>
    );
    const content = (
      <td>
        <a onClick={this.onBlockClickProxy(blockNumber)} tabIndex={0}>
          {message}
        </a>
      </td>
    );
    const isUnifiedViewWithoutLineNumbers = !splitView && !hideLineNumbers;
    return (
      <tr
        key={`${leftBlockLineNumber}-${rightBlockLineNumber}`}
        className={this.styles.codeFold}
      >
        {!hideLineNumbers && <td className={this.styles.codeFoldGutter} />}
        {this.props.renderGutter ? <td className={this.styles.codeFoldGutter} /> : null}
        <td
          className={cn({
            [this.styles.codeFoldGutter]: isUnifiedViewWithoutLineNumbers,
          })}
        />

        {isUnifiedViewWithoutLineNumbers ? (
          <React.Fragment>
            <td />
            {content}
          </React.Fragment>
        ) : (
          <React.Fragment>
            {content}
            {this.props.renderGutter ? <td /> : null}
            <td />
          </React.Fragment>
        )}

        <td />
        <td />
      </tr>
    );
  };

  private renderDiff = (): JSX.Element[] => {
    const {
      oldValue,
      newValue,
      noise,
      splitView,
      disableWordDiff,
      compareMethod,
      linesOffset,
    } = this.props;
    const { lineInformation, diffLines } = computeLineInformation(
      oldValue,
      newValue,
      noise,
      disableWordDiff,
      compareMethod,
      linesOffset,
    );

    const extraLines =
      this.props.extraLinesSurroundingDiff < 0 ? 0 : this.props.extraLinesSurroundingDiff;
    let skippedLines: number[] = [];
    return lineInformation.map((line: LineInformation, i: number): JSX.Element => {
      const diffBlockStart = diffLines[0];
      const currentPosition = diffBlockStart - i;
      if (this.props.showDiffOnly) {
        if (currentPosition === -extraLines) {
          skippedLines = [];
          diffLines.shift();
        }
        if (
          line.left.type === DiffType.DEFAULT &&
          (currentPosition > extraLines || typeof diffBlockStart === 'undefined') &&
          !this.state.expandedBlocks.includes(diffBlockStart)
        ) {
          skippedLines.push(i + 1);
          if (i === lineInformation.length - 1 && skippedLines.length > 1) {
            return this.renderSkippedLineIndicator(
              skippedLines.length,
              diffBlockStart,
              line.left.lineNumber,
              line.right.lineNumber,
            );
          }
          return null;
        }
      }

      const diffNodes = splitView
        ? this.renderSplitView(line, i)
        : this.renderInlineView(line, i);

      if (currentPosition === extraLines && skippedLines.length > 0) {
        const { length } = skippedLines;
        skippedLines = [];
        return (
          <React.Fragment key={i}>
            {this.renderSkippedLineIndicator(
              length,
              diffBlockStart,
              line.left.lineNumber,
              line.right.lineNumber,
            )}
            {diffNodes}
          </React.Fragment>
        );
      }
      return diffNodes;
    });
  };

  public render = (): JSX.Element => {
    const {
      oldValue,
      newValue,
      useDarkTheme,
      leftTitle,
      rightTitle,
      splitView,
      hideLineNumbers,
    } = this.props;

    if (typeof oldValue !== 'string' || typeof newValue !== 'string') {
      throw Error('"oldValue" and "newValue" should be strings');
    }

    this.styles = this.computeStyles(this.props.styles, useDarkTheme);
    const nodes = this.renderDiff();
    const colSpanOnSplitView = hideLineNumbers ? 2 : 3;
    const colSpanOnInlineView = hideLineNumbers ? 2 : 4;
    let columnExtension = this.props.renderGutter ? 1 : 0;

    const title = (leftTitle || rightTitle) && (
      <tr>
        <td
          colSpan={
            (splitView ? colSpanOnSplitView : colSpanOnInlineView) + columnExtension
          }
          className={this.styles.titleBlock}
        >
          <pre className={this.styles.contentText}>{leftTitle}</pre>
        </td>
        {splitView && (
          <td
            colSpan={colSpanOnSplitView + columnExtension}
            className={this.styles.titleBlock}
          >
            <pre className={this.styles.contentText}>{rightTitle}</pre>
          </td>
        )}
      </tr>
    );

    return (
      <table
        className={cn(this.styles.diffContainer, {
          [this.styles.splitView]: splitView,
        })}
      >
        <tbody>
          {title}
          {nodes}
        </tbody>
      </table>
    );
  };
}

export default DiffViewer;
export { ReactDiffViewerStylesOverride, DiffMethod };
