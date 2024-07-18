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
}
declare const computeLineInformation: (oldString: string, newString: string, noise: string[], disableWordDiff?: boolean, compareMethod?: string | ((oldStr: string, newStr: string) => DiffChange[]), linesOffset?: number) => ComputedLineInformation;
export { computeLineInformation };
