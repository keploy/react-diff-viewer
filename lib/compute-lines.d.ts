import * as diff from 'diff';
export declare enum DiffType {
    DEFAULT = 0,
    ADDED = 1,
    REMOVED = 2,
    NOISED = 3
}
export declare enum DiffMethod {
    CHARS = "diffChars",
    WORDS = "diffWords",
    WORDS_WITH_SPACE = "diffWordsWithSpace",
    LINES = "diffLines",
    TRIMMED_LINES = "diffTrimmedLines",
    SENTENCES = "diffSentences",
    CSS = "diffCss"
}
export interface DiffInformation {
    value?: string | DiffInformation[];
    lineNumber?: number;
    type?: DiffType;
    flattenPath?: string;
}
export interface LineInformation {
    left?: DiffInformation;
    right?: DiffInformation;
}
export interface ComputedLineInformation {
    lineInformation: LineInformation[];
    diffLines: number[];
}
interface DiffChange extends diff.Change {
    noised?: boolean;
    flattenPath?: string;
}
export interface ComputedDiffInformation {
    left?: DiffInformation[];
    right?: DiffInformation[];
}
export interface JsDiffChangeObject {
    added?: boolean;
    removed?: boolean;
    value?: string;
    noised?: boolean;
    flattenPath?: string;
}
/**
 * Computes line-wise diff information from two input strings. If JSON, uses CompareJSON,
 * otherwise uses a simple line diff. Also incorporates flattenPath from CompareJSON results.
 *
 * @param oldString Old string to compare.
 * @param newString New string to compare with old string.
 * @param noise Noise array for ignoring certain paths.
 * @param disableWordDiff Flag to enable/disable word diff.
 * @param compareMethod JsDiff method.
 * @param linesOffset Starting line number offset.
 */
export declare const computeLineInformation: (oldString: string, newString: string, noise: string[], disableWordDiff?: boolean, compareMethod?: string | ((oldStr: string, newStr: string) => DiffChange[]), linesOffset?: number) => ComputedLineInformation;
export {};
