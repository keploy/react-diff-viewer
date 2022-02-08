import * as diff from 'diff';

const jsDiff: { [key: string]: any } = diff;

export enum DiffType {
	DEFAULT = 0,
	ADDED = 1,
	REMOVED = 2,
}

// See https://github.com/kpdecker/jsdiff/tree/v4.0.1#api for more info on the below JsDiff methods
export enum DiffMethod {
	CHARS = 'diffChars',
	WORDS = 'diffWords',
	WORDS_WITH_SPACE = 'diffWordsWithSpace',
	LINES = 'diffLines',
	TRIMMED_LINES = 'diffTrimmedLines',
	SENTENCES = 'diffSentences',
	CSS = 'diffCss',
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

export interface ComputedDiffInformation {
	left?: DiffInformation[];
	right?: DiffInformation[];
}

// See https://github.com/kpdecker/jsdiff/tree/v4.0.1#change-objects for more info on JsDiff
// Change Objects
export interface JsDiffChangeObject {
	added?: boolean;
	removed?: boolean;
	value?: string;
}

/**
 * Splits diff text by new line and computes final list of diff lines based on
 * conditions.
 *
 * @param value Diff text from the js diff module.
 */
const constructLines = (value: string): string[] => {
	const lines = value.split('\n');
	const isAllEmpty = lines.every((val): boolean => !val);
	if (isAllEmpty) {
		// This is to avoid added an extra new line in the UI.
		if (lines.length === 2) {
			return [];
		}
		lines.pop();
		return lines;
	}

	const lastLine = lines[lines.length - 1];
	const firstLine = lines[0];
	// Remove the first and last element if they are new line character. This is
	// to avoid addition of extra new line in the UI.
	if (!lastLine) {
		lines.pop();
	}
	if (!firstLine) {
		lines.shift();
	}
	return lines;
};

/**
 * Computes word diff information in the line.
 * [TODO]: Consider adding options argument for JsDiff text block comparison
 *
 * @param oldValue Old word in the line.
 * @param newValue New word in the line.
 * @param compareMethod JsDiff text diff method from https://github.com/kpdecker/jsdiff/tree/v4.0.1#api
 */
const computeDiff = (
	oldValue: string,
	newValue: string,
	compareMethod: string | ((oldStr: string, newStr: string) => diff.Change[]) = DiffMethod.CHARS,
): ComputedDiffInformation => {
	const diffArray: JsDiffChangeObject[] = ((typeof compareMethod === 'string') ? jsDiff[compareMethod] : compareMethod)(
		oldValue,
		newValue,
	);
	const computedDiff: ComputedDiffInformation = {
		left: [],
		right: [],
	};
	diffArray.forEach(
		({ added, removed, value }): DiffInformation => {
			const diffInformation: DiffInformation = {};
			if (added) {
				diffInformation.type = DiffType.ADDED;
				diffInformation.value = value;
				computedDiff.right.push(diffInformation);
			}
			if (removed) {
				diffInformation.type = DiffType.REMOVED;
				diffInformation.value = value;
				computedDiff.left.push(diffInformation);
			}
			if (!removed && !added) {
				diffInformation.type = DiffType.DEFAULT;
				diffInformation.value = value;
				computedDiff.right.push(diffInformation);
				computedDiff.left.push(diffInformation);
			}
			return diffInformation;
		},
	);
	return computedDiff;
};

/**
 * [TODO]: Think about moving common left and right value assignment to a
 * common place. Better readability?
 *
 * Computes line wise information based in the js diff information passed. Each
 * line contains information about left and right section. Left side denotes
 * deletion and right side denotes addition.
 *
 * @param oldString Old string to compare.
 * @param newString New string to compare with old string.
 * @param disableWordDiff Flag to enable/disable word diff.
 * @param compareMethod JsDiff text diff method from https://github.com/kpdecker/jsdiff/tree/v4.0.1#api
 * @param linesOffset line number to start counting from
 */
const computeLineInformation = (
	oldString: string,
	newString: string,
	disableWordDiff: boolean = false,
	compareMethod: string | ((oldStr: string, newStr: string) => diff.Change[]) = DiffMethod.CHARS,
	linesOffset: number = 0,
): ComputedLineInformation => {
	const diffArray = diff.diffLines(
		oldString.trimRight(),
		newString.trimRight(),
		{
			newlineIsToken: true,
			ignoreWhitespace: false,
			ignoreCase: false,
		},
	);
	console.log(diffArray)
	diffArray.forEach((element, elIndex) => {
		if (element.value.includes("keploy.noise")){
			element.added = undefined
			element.removed = undefined
		}
	});
	let rightLineNumber = linesOffset;
	let leftLineNumber = linesOffset;
	let lineInformation: LineInformation[] = [];
	let counter = 0;
	const diffLines: number[] = [];
	const ignoreDiffIndexes: string[] = [];
	const getLineInformation = (
		value: string,
		diffIndex: number,
		added?: boolean,
		removed?: boolean,
		evaluateOnlyFirstLine?: boolean,
	): LineInformation[] => {
		if (value.includes("keploy.noise")){
			const stIgnore = value.indexOf("keploy.noise")
			value = value.substring(0, stIgnore) + value.substring(stIgnore+14)
		}
		const lines = constructLines(value);

		return lines
			.map(
				(line: string, lineIndex): LineInformation => {
					const left: DiffInformation = {};
					const right: DiffInformation = {};
					if (
						ignoreDiffIndexes.includes(`${diffIndex}-${lineIndex}`) ||
						(evaluateOnlyFirstLine && lineIndex !== 0)
					) {
						return undefined;
					}
					if (added || removed) {
						if (!diffLines.includes(counter)) {
							diffLines.push(counter);
						}
						if (removed) {
							leftLineNumber += 1;
							left.lineNumber = leftLineNumber;
							left.type = DiffType.REMOVED;
							left.value = line || ' ';
							// When the current line is of type REMOVED, check the next item in
							// the diff array whether it is of type ADDED. If true, the current
							// diff will be marked as both REMOVED and ADDED. Meaning, the
							// current line is a modification.
							const nextDiff = diffArray[diffIndex + 1];
							if (nextDiff && nextDiff.added) {
								const nextDiffLines = constructLines(nextDiff.value)[lineIndex];
								if (nextDiffLines) {
									const {
										value: rightValue,
										lineNumber,
										type,
									} = getLineInformation(
										nextDiff.value,
										diffIndex,
										true,
										false,
										true,
									)[0].right;
									// When identified as modification, push the next diff to ignore
									// list as the next value will be added in this line computation as
									// right and left values.
									ignoreDiffIndexes.push(`${diffIndex + 1}-${lineIndex}`);
									right.lineNumber = lineNumber;
									right.type = type;
									// Do word level diff and assign the corresponding values to the
									// left and right diff information object.
									if (disableWordDiff) {
										right.value = rightValue;
									} else {
										const computedDiff = computeDiff(
											line,
											rightValue as string,
											compareMethod,
										);
										right.value = computedDiff.right;
										left.value = computedDiff.left;
									}
								}
							}
						} else {
							rightLineNumber += 1;
							right.lineNumber = rightLineNumber;
							right.type = DiffType.ADDED;
							right.value = line;
						}
					} else {
						
						if (diffArray[diffIndex].value.includes("keploy.noise.l")){
							leftLineNumber += 1;
							rightLineNumber += 1;

							left.lineNumber = leftLineNumber;
							left.type = DiffType.DEFAULT;
							right.lineNumber = rightLineNumber;
							right.type = DiffType.DEFAULT;
							left.value = line;
							var rightValue
							if (diffArray[diffIndex+1].value.includes("keploy.noise")){
								const stIgnore = diffArray[diffIndex+1].value.indexOf("keploy.noise")
								rightValue = diffArray[diffIndex+1].value.substring(0, stIgnore) + diffArray[diffIndex+1].value.substring(stIgnore+14)
							}
							console.log("***", rightValue, diffArray[diffIndex+1].value, "***")
							const rightLineToBeIgnored = constructLines(rightValue);
							if (lineIndex <= rightLineToBeIgnored.length){
								right.value = rightLineToBeIgnored[lineIndex]
								if (lineIndex === lines.length-1){
									for(var i=lineIndex+1; i<rightLineToBeIgnored.length ;i++){
										lines.push(" ")
									}
								}
							} 
						} 
						else if(!diffArray[diffIndex].value.includes("keploy.noise")) {
							leftLineNumber += 1;
							rightLineNumber += 1;

							left.lineNumber = leftLineNumber;
							left.type = DiffType.DEFAULT;
							right.lineNumber = rightLineNumber;
							right.type = DiffType.DEFAULT;
							left.value = line;
							right.value = line;
						}
					}

					counter += 1;
					return { right, left };
				},
			)
			.filter(Boolean);
	};

	diffArray.forEach(({ added, removed, value }: diff.Change, index): void => {
		lineInformation = [
			...lineInformation,
			...getLineInformation(value, index, added, removed),
		];
	});

	return {
		lineInformation,
		diffLines,
	};
};

export { computeLineInformation };
