"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiffMethod = exports.LineNumberPrefix = void 0;
const React = require("react");
const PropTypes = require("prop-types");
const cn = require("classnames");
const compute_lines_1 = require("./compute-lines");
Object.defineProperty(exports, "DiffMethod", { enumerable: true, get: function () { return compute_lines_1.DiffMethod; } });
const styles_1 = require("./styles");
const m = require('memoize-one');
const memoize = m.default || m;
var LineNumberPrefix;
(function (LineNumberPrefix) {
    LineNumberPrefix["LEFT"] = "L";
    LineNumberPrefix["RIGHT"] = "R";
})(LineNumberPrefix = exports.LineNumberPrefix || (exports.LineNumberPrefix = {}));
class DiffViewer extends React.Component {
    constructor(props) {
        super(props);
        this.resetCodeBlocks = () => {
            if (this.state.expandedBlocks.length > 0) {
                this.setState({
                    expandedBlocks: [],
                });
                return true;
            }
            return false;
        };
        this.onBlockExpand = (id) => {
            const prevState = this.state.expandedBlocks.slice();
            prevState.push(id);
            this.setState({
                expandedBlocks: prevState,
            });
        };
        this.computeStyles = memoize(styles_1.default);
        this.onLineNumberClickProxy = (id) => {
            if (this.props.onLineNumberClick) {
                return (e) => this.props.onLineNumberClick(id, e);
            }
            return () => { };
        };
        this.renderWordDiff = (diffArray, renderer) => {
            return diffArray.map((wordDiff, i) => {
                return (React.createElement("span", { key: i, className: cn(this.styles.wordDiff, {
                        [this.styles.wordAdded]: wordDiff.type === compute_lines_1.DiffType.ADDED,
                        [this.styles.wordRemoved]: wordDiff.type === compute_lines_1.DiffType.REMOVED,
                        [this.styles.wordNoised]: wordDiff.type === compute_lines_1.DiffType.NOISED,
                    }), "data-flattenpath": wordDiff.flattenPath || '' }, renderer ? renderer(wordDiff.value) : wordDiff.value));
            });
        };
        this.renderLine = (lineNumber, type, prefix, value, flattenPath, additionalLineNumber, additionalPrefix) => {
            const lineNumberTemplate = `${prefix}-${lineNumber}`;
            const additionalLineNumberTemplate = `${additionalPrefix}-${additionalLineNumber}`;
            const highlightLine = this.props.highlightLines.includes(lineNumberTemplate) ||
                this.props.highlightLines.includes(additionalLineNumberTemplate);
            const added = type === compute_lines_1.DiffType.ADDED;
            const removed = type === compute_lines_1.DiffType.REMOVED;
            const noised = type === compute_lines_1.DiffType.NOISED;
            let content;
            if (Array.isArray(value)) {
                content = this.renderWordDiff(value, this.props.renderContent);
            }
            else if (this.props.renderContent) {
                content = this.props.renderContent(value);
            }
            else {
                content = value;
            }
            return (React.createElement(React.Fragment, null,
                !this.props.hideLineNumbers && (React.createElement("td", { onClick: lineNumber && this.onLineNumberClickProxy(lineNumberTemplate), className: cn(this.styles.gutter, {
                        [this.styles.emptyGutter]: !lineNumber,
                        [this.styles.diffAdded]: added,
                        [this.styles.diffRemoved]: removed,
                        [this.styles.diffNoised]: noised,
                        [this.styles.highlightedGutter]: highlightLine,
                    }), "data-flattenpath": flattenPath || '' },
                    React.createElement("pre", { className: this.styles.lineNumber }, lineNumber))),
                !this.props.splitView && !this.props.hideLineNumbers && (React.createElement("td", { onClick: additionalLineNumber && this.onLineNumberClickProxy(additionalLineNumberTemplate), className: cn(this.styles.gutter, {
                        [this.styles.emptyGutter]: !additionalLineNumber,
                        [this.styles.diffAdded]: added,
                        [this.styles.diffRemoved]: removed,
                        [this.styles.diffNoised]: noised,
                        [this.styles.highlightedGutter]: highlightLine,
                    }), "data-flattenpath": flattenPath || '' },
                    React.createElement("pre", { className: this.styles.lineNumber }, additionalLineNumber))),
                this.props.renderGutter
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
                    : null,
                React.createElement("td", { className: cn(this.styles.marker, {
                        [this.styles.emptyLine]: !content,
                        [this.styles.diffAdded]: added,
                        [this.styles.diffRemoved]: removed,
                        [this.styles.diffNoised]: noised,
                        [this.styles.highlightedLine]: highlightLine,
                    }), "data-flattenpath": flattenPath || '' },
                    React.createElement("pre", null,
                        added && '+',
                        removed && '-')),
                React.createElement("td", { className: cn(this.styles.content, {
                        [this.styles.emptyLine]: !content,
                        [this.styles.diffAdded]: added,
                        [this.styles.diffRemoved]: removed,
                        [this.styles.diffNoised]: noised,
                        [this.styles.highlightedLine]: highlightLine,
                    }), "data-flattenpath": flattenPath || '' },
                    React.createElement("pre", { className: cn(this.styles.contentText, {
                            [this.styles.wordNoised]: noised,
                        }) }, content))));
        };
        this.renderSplitView = ({ left, right }, index) => {
            return (React.createElement("tr", { key: index, className: this.styles.line },
                this.renderLine(left.lineNumber, left.type, LineNumberPrefix.LEFT, left.value, left.flattenPath),
                this.renderLine(right.lineNumber, right.type, LineNumberPrefix.RIGHT, right.value, right.flattenPath)));
        };
        this.renderInlineView = ({ left, right }, index) => {
            if (left.type === compute_lines_1.DiffType.REMOVED && right.type === compute_lines_1.DiffType.ADDED) {
                return (React.createElement(React.Fragment, { key: index },
                    React.createElement("tr", { className: this.styles.line }, this.renderLine(left.lineNumber, left.type, LineNumberPrefix.LEFT, left.value, left.flattenPath)),
                    React.createElement("tr", { className: this.styles.line }, this.renderLine(null, right.type, LineNumberPrefix.RIGHT, right.value, right.flattenPath, right.lineNumber))));
            }
            let content;
            if (left.type === compute_lines_1.DiffType.REMOVED) {
                content = this.renderLine(left.lineNumber, left.type, LineNumberPrefix.LEFT, left.value, left.flattenPath, null);
            }
            if (left.type === compute_lines_1.DiffType.DEFAULT) {
                content = this.renderLine(left.lineNumber, left.type, LineNumberPrefix.LEFT, left.value, left.flattenPath, right.lineNumber, LineNumberPrefix.RIGHT);
            }
            if (right.type === compute_lines_1.DiffType.ADDED) {
                content = this.renderLine(null, right.type, LineNumberPrefix.RIGHT, right.value, right.flattenPath, right.lineNumber);
            }
            return (React.createElement("tr", { key: index, className: this.styles.line }, content));
        };
        this.onBlockClickProxy = (id) => () => this.onBlockExpand(id);
        this.renderSkippedLineIndicator = (num, blockNumber, leftBlockLineNumber, rightBlockLineNumber) => {
            const { hideLineNumbers, splitView } = this.props;
            const message = this.props.codeFoldMessageRenderer ? (this.props.codeFoldMessageRenderer(num, leftBlockLineNumber, rightBlockLineNumber)) : (React.createElement("pre", { className: this.styles.codeFoldContent },
                "Expand ",
                num,
                " lines ..."));
            const content = (React.createElement("td", null,
                React.createElement("a", { onClick: this.onBlockClickProxy(blockNumber), tabIndex: 0 }, message)));
            const isUnifiedViewWithoutLineNumbers = !splitView && !hideLineNumbers;
            return (React.createElement("tr", { key: `${leftBlockLineNumber}-${rightBlockLineNumber}`, className: this.styles.codeFold },
                !hideLineNumbers && React.createElement("td", { className: this.styles.codeFoldGutter }),
                this.props.renderGutter ? React.createElement("td", { className: this.styles.codeFoldGutter }) : null,
                React.createElement("td", { className: cn({
                        [this.styles.codeFoldGutter]: isUnifiedViewWithoutLineNumbers,
                    }) }),
                isUnifiedViewWithoutLineNumbers ? (React.createElement(React.Fragment, null,
                    React.createElement("td", null),
                    content)) : (React.createElement(React.Fragment, null,
                    content,
                    this.props.renderGutter ? React.createElement("td", null) : null,
                    React.createElement("td", null))),
                React.createElement("td", null),
                React.createElement("td", null)));
        };
        this.renderDiff = () => {
            const { oldValue, newValue, noise, splitView, disableWordDiff, compareMethod, linesOffset, } = this.props;
            const { lineInformation, diffLines } = (0, compute_lines_1.computeLineInformation)(oldValue, newValue, noise, disableWordDiff, compareMethod, linesOffset);
            const extraLines = this.props.extraLinesSurroundingDiff < 0 ? 0 : this.props.extraLinesSurroundingDiff;
            let skippedLines = [];
            return lineInformation.map((line, i) => {
                const diffBlockStart = diffLines[0];
                const currentPosition = diffBlockStart - i;
                if (this.props.showDiffOnly) {
                    if (currentPosition === -extraLines) {
                        skippedLines = [];
                        diffLines.shift();
                    }
                    if (line.left.type === compute_lines_1.DiffType.DEFAULT &&
                        (currentPosition > extraLines || typeof diffBlockStart === 'undefined') &&
                        !this.state.expandedBlocks.includes(diffBlockStart)) {
                        skippedLines.push(i + 1);
                        if (i === lineInformation.length - 1 && skippedLines.length > 1) {
                            return this.renderSkippedLineIndicator(skippedLines.length, diffBlockStart, line.left.lineNumber, line.right.lineNumber);
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
                    return (React.createElement(React.Fragment, { key: i },
                        this.renderSkippedLineIndicator(length, diffBlockStart, line.left.lineNumber, line.right.lineNumber),
                        diffNodes));
                }
                return diffNodes;
            });
        };
        this.render = () => {
            const { oldValue, newValue, useDarkTheme, leftTitle, rightTitle, splitView, hideLineNumbers, } = this.props;
            if (typeof oldValue !== 'string' || typeof newValue !== 'string') {
                throw Error('"oldValue" and "newValue" should be strings');
            }
            this.styles = this.computeStyles(this.props.styles, useDarkTheme);
            const nodes = this.renderDiff();
            const colSpanOnSplitView = hideLineNumbers ? 2 : 3;
            const colSpanOnInlineView = hideLineNumbers ? 2 : 4;
            let columnExtension = this.props.renderGutter ? 1 : 0;
            const title = (leftTitle || rightTitle) && (React.createElement("tr", null,
                React.createElement("td", { colSpan: (splitView ? colSpanOnSplitView : colSpanOnInlineView) + columnExtension, className: this.styles.titleBlock },
                    React.createElement("pre", { className: this.styles.contentText }, leftTitle)),
                splitView && (React.createElement("td", { colSpan: colSpanOnSplitView + columnExtension, className: this.styles.titleBlock },
                    React.createElement("pre", { className: this.styles.contentText }, rightTitle)))));
            return (React.createElement("table", { className: cn(this.styles.diffContainer, {
                    [this.styles.splitView]: splitView,
                }) },
                React.createElement("tbody", null,
                    title,
                    nodes)));
        };
        this.state = {
            expandedBlocks: [],
        };
    }
}
DiffViewer.defaultProps = {
    oldValue: '',
    newValue: '',
    noise: [],
    splitView: true,
    highlightLines: [],
    disableWordDiff: false,
    compareMethod: compute_lines_1.DiffMethod.CHARS,
    styles: {},
    hideLineNumbers: false,
    extraLinesSurroundingDiff: 3,
    showDiffOnly: true,
    useDarkTheme: false,
    linesOffset: 0,
};
DiffViewer.propTypes = {
    oldValue: PropTypes.string.isRequired,
    newValue: PropTypes.string.isRequired,
    noise: PropTypes.arrayOf(PropTypes.string),
    splitView: PropTypes.bool,
    disableWordDiff: PropTypes.bool,
    compareMethod: PropTypes.oneOfType([PropTypes.oneOf(Object.values(compute_lines_1.DiffMethod)), PropTypes.func]),
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
exports.default = DiffViewer;
