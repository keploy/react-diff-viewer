import * as React from 'react';
import * as PropTypes from 'prop-types';
import { Change } from 'diff';
import { LineInformation, DiffInformation, DiffType, DiffMethod } from './compute-lines';
import { ReactDiffViewerStyles, ReactDiffViewerStylesOverride } from './styles';
export declare enum LineNumberPrefix {
    LEFT = "L",
    RIGHT = "R"
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
    codeFoldMessageRenderer?: (totalFoldedLines: number, leftStartLineNumber: number, rightStartLineNumber: number) => JSX.Element;
    onLineNumberClick?: (lineId: string, event: React.MouseEvent<HTMLTableCellElement>) => void;
    renderGutter?: (data: {
        lineNumber: number;
        type: DiffType;
        prefix: LineNumberPrefix;
        value: string | DiffInformation[];
        additionalLineNumber: number;
        additionalPrefix: LineNumberPrefix;
        styles: ReactDiffViewerStyles;
        flattenPath: string;
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
declare class DiffViewer extends React.Component<ReactDiffViewerProps, ReactDiffViewerState> {
    private styles;
    static defaultProps: ReactDiffViewerProps;
    static propTypes: {
        oldValue: PropTypes.Validator<string>;
        newValue: PropTypes.Validator<string>;
        noise: PropTypes.Requireable<string[]>;
        splitView: PropTypes.Requireable<boolean>;
        disableWordDiff: PropTypes.Requireable<boolean>;
        compareMethod: PropTypes.Requireable<NonNullable<DiffMethod | ((...args: any[]) => any)>>;
        renderContent: PropTypes.Requireable<(...args: any[]) => any>;
        onLineNumberClick: PropTypes.Requireable<(...args: any[]) => any>;
        extraLinesSurroundingDiff: PropTypes.Requireable<number>;
        styles: PropTypes.Requireable<object>;
        hideLineNumbers: PropTypes.Requireable<boolean>;
        showDiffOnly: PropTypes.Requireable<boolean>;
        highlightLines: PropTypes.Requireable<string[]>;
        leftTitle: PropTypes.Requireable<NonNullable<string | PropTypes.ReactElementLike>>;
        rightTitle: PropTypes.Requireable<NonNullable<string | PropTypes.ReactElementLike>>;
        linesOffset: PropTypes.Requireable<number>;
    };
    constructor(props: ReactDiffViewerProps);
    resetCodeBlocks: () => boolean;
    private onBlockExpand;
    private computeStyles;
    private onLineNumberClickProxy;
    private renderWordDiff;
    private renderLine;
    private renderSplitView;
    renderInlineView: ({ left, right }: LineInformation, index: number) => JSX.Element;
    private onBlockClickProxy;
    private renderSkippedLineIndicator;
    private renderDiff;
    render: () => JSX.Element;
}
export default DiffViewer;
export { ReactDiffViewerStylesOverride, DiffMethod };
