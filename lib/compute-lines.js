"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeLineInformation = exports.DiffMethod = exports.DiffType = void 0;
/* eslint-disable space-before-blocks */
/* eslint-disable no-useless-concat */
/* eslint-disable no-lonely-if */
/* eslint-disable default-case */
/* eslint-disable brace-style */
/* eslint-disable array-callback-return */
/* eslint-disable no-plusplus */
/* eslint-disable eqeqeq */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-shadow */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-param-reassign */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable max-len */
// keploy-react-diff
const diff = require("diff");
const jsDiff = diff;
var DiffType;
(function (DiffType) {
    DiffType[DiffType["DEFAULT"] = 0] = "DEFAULT";
    DiffType[DiffType["ADDED"] = 1] = "ADDED";
    DiffType[DiffType["REMOVED"] = 2] = "REMOVED";
    DiffType[DiffType["NOISED"] = 3] = "NOISED";
})(DiffType = exports.DiffType || (exports.DiffType = {}));
// See https://github.com/kpdecker/jsdiff/tree/v4.0.1#api for more info on the below JsDiff methods
var DiffMethod;
(function (DiffMethod) {
    DiffMethod["CHARS"] = "diffChars";
    DiffMethod["WORDS"] = "diffWords";
    DiffMethod["WORDS_WITH_SPACE"] = "diffWordsWithSpace";
    DiffMethod["LINES"] = "diffLines";
    DiffMethod["TRIMMED_LINES"] = "diffTrimmedLines";
    DiffMethod["SENTENCES"] = "diffSentences";
    DiffMethod["CSS"] = "diffCss";
})(DiffMethod = exports.DiffMethod || (exports.DiffMethod = {}));
/**
 * Splits diff text by new line and computes final list of diff lines based on conditions.
 *
 * @param value Diff text from the js diff module.
 */
const constructLines = (value) => {
    if (value === undefined) {
        return [];
    }
    value = value.replace(/\n,/gi, "\n");
    if (value.trim() === ",") {
        value = "";
    }
    const lines = value.split('\n');
    const isAllEmpty = lines.every((val) => !val);
    if (isAllEmpty) {
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
const computeDiff = (oldValue, newValue, compareMethod = DiffMethod.CHARS) => {
    const diffArray = ((typeof compareMethod === 'string') ? jsDiff[compareMethod] : compareMethod)(oldValue, newValue);
    const computedDiff = {
        left: [],
        right: [],
    };
    diffArray.forEach(({ added, removed, value }) => {
        const diffInformation = {};
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
    });
    return computedDiff;
};
const sanitizeInput = (input) => {
    return input.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\/g, '');
};
function noiseDiffArray(expectedObj, actualObj, key, flattenKeyPath = '') {
    const result = [];
    const expectedLines = constructLines(JSON.stringify(expectedObj, null, 2));
    const actualLines = constructLines(JSON.stringify(actualObj, null, 2));
    expectedLines.forEach((el, elIndex) => {
        // to handle common length of both lines array.
        if (elIndex < actualLines.length) {
            // add key only to the first line before and after seperator.
            if (elIndex === 0) {
                actualLines[elIndex] = sanitizeInput(actualLines[elIndex]);
                el = sanitizeInput(el);
                result.push({ count: -2, noised: true, value: `${key + el}_keploy_|_keploy_${key}${actualLines[elIndex]}`, flattenPath: flattenKeyPath });
            }
            else {
                actualLines[elIndex] = sanitizeInput(actualLines[elIndex]);
                el = sanitizeInput(el);
                result.push({ count: -2, noised: true, value: `  ${el}_keploy_|_keploy_  ${actualLines[elIndex]}`, flattenPath: flattenKeyPath });
            }
        }
        else if (elIndex === 0) {
            el = sanitizeInput(el);
            result.push({ count: -2, noised: true, value: `${key + el}_keploy_|_keploy_${key}`, flattenPath: flattenKeyPath });
        }
        else {
            el = sanitizeInput(el);
            result.push({ count: -2, noised: true, value: `  ${el}_keploy_|_keploy_`, flattenPath: flattenKeyPath });
        }
    });
    for (let indx = expectedLines.length; indx < actualLines.length; indx++) {
        if (indx === 0) {
            actualLines[indx] = sanitizeInput(actualLines[indx]);
            result.push({ count: -2, noised: true, value: `${key}_keploy_|_keploy_${key}${actualLines[indx]}`, flattenPath: flattenKeyPath });
        }
        else {
            actualLines[indx] = sanitizeInput(actualLines[indx]);
            result.push({ count: -2, noised: true, value: `_keploy_|_keploy_  ${actualLines[indx]}`, flattenPath: flattenKeyPath });
        }
    }
    return result;
}
function CompareJSON(expectedStr, actualStr, noise, flattenKeyPath) {
    const result = [];
    const expectedJSON = JSON.parse(expectedStr);
    const actualJSON = JSON.parse(actualStr);
    // Type mismatch
    if (typeof expectedJSON !== typeof actualJSON) {
        if (!noise.includes(flattenKeyPath)) {
            result.push({ count: -1, removed: true, value: JSON.stringify(expectedJSON, null, 2), flattenPath: flattenKeyPath });
            result.push({ count: -1, added: true, value: JSON.stringify(actualJSON, null, 2), flattenPath: flattenKeyPath });
            return result;
        }
        const output = noiseDiffArray(expectedJSON, actualJSON, '', flattenKeyPath);
        output.forEach((el) => {
            result.push(Object.assign(Object.assign({}, el), { noised: true }));
        });
        return result;
    }
    switch (typeof expectedJSON) {
        case 'string': {
            if (expectedJSON === actualJSON) {
                result.push({ count: -1, value: expectedJSON, flattenPath: flattenKeyPath });
                return result;
            }
            if (noise.includes(flattenKeyPath)) {
                const output = noiseDiffArray(expectedJSON, actualJSON, '', flattenKeyPath);
                output.forEach((el) => {
                    result.push(Object.assign(Object.assign({}, el), { noised: true }));
                });
            }
            else {
                result.push({ count: -1, removed: true, value: expectedJSON, flattenPath: flattenKeyPath });
                result.push({ count: -1, added: true, value: actualJSON, flattenPath: flattenKeyPath });
                return result;
            }
            break;
        }
        case 'number': {
            if (expectedJSON === actualJSON) {
                result.push({ count: -1, value: expectedStr, flattenPath: flattenKeyPath });
                return result;
            }
            if (noise.includes(flattenKeyPath)) {
                const output = noiseDiffArray(expectedJSON, actualJSON, '', flattenKeyPath);
                output.forEach((el) => {
                    result.push(Object.assign(Object.assign({}, el), { noised: true }));
                });
            }
            else {
                result.push({ count: -1, removed: true, value: expectedStr, flattenPath: flattenKeyPath });
                result.push({ count: -1, added: true, value: actualStr, flattenPath: flattenKeyPath });
                return result;
            }
            break;
        }
        case 'boolean': {
            if (expectedStr === actualStr) {
                result.push({ count: -1, value: expectedStr, flattenPath: flattenKeyPath });
                return result;
            }
            if (noise.includes(flattenKeyPath)) {
                const output = noiseDiffArray(expectedJSON, actualJSON, '', flattenKeyPath);
                output.forEach((el) => {
                    result.push(Object.assign(Object.assign({}, el), { noised: true }));
                });
            }
            else {
                result.push({ count: -1, removed: true, value: expectedStr, flattenPath: flattenKeyPath });
                result.push({ count: -1, added: true, value: actualStr, flattenPath: flattenKeyPath });
                return result;
            }
            break;
        }
        case 'object': {
            if (noise.includes(flattenKeyPath)) {
                const output = noiseDiffArray(expectedJSON, actualJSON, '', flattenKeyPath);
                output.forEach((el) => {
                    result.push(Object.assign(Object.assign({}, el), { noised: true }));
                });
                return result;
            }
            // Both arrays
            if (Array.isArray(expectedJSON) && Array.isArray(actualJSON)) {
                result.push({ count: -1, value: '[', flattenPath: flattenKeyPath });
                expectedJSON.forEach((el, elIndx) => {
                    const elementPath = flattenKeyPath === "" ? `[${elIndx}]` : `${flattenKeyPath}[${elIndx}]`;
                    if (elIndx < actualJSON.length) {
                        const output = CompareJSON(JSON.stringify(el, null, 2), JSON.stringify(actualJSON[elIndx], null, 2), noise, elementPath);
                        output.forEach((res) => {
                            res.value = `  ${res.value}`;
                            if (res.value[res.value.length - 1] !== ',' &&
                                res.value.trim() !== "{" &&
                                !res.value.endsWith("_keploy_|_keploy_")) {
                                res.value += ',';
                            }
                            // ensure each element line has correct flattenPath
                            res.flattenPath = res.flattenPath || elementPath;
                            result.push(res);
                        });
                    }
                    else {
                        const lines = constructLines(JSON.stringify(el, null, 2));
                        lines.forEach((line) => {
                            let modifiedLine = `  ${line}`;
                            if (modifiedLine.trim() !== "{") {
                                modifiedLine = modifiedLine + ",";
                            }
                            result.push({ count: -1, removed: true, value: modifiedLine, flattenPath: elementPath });
                        });
                    }
                });
                for (let indx = expectedJSON.length; indx < actualJSON.length; indx++) {
                    if (result[result.length - 1].removed) {
                        result.push({ count: -3, value: "", flattenPath: flattenKeyPath });
                    }
                    const elementPath = flattenKeyPath === "" ? `[${indx}]` : `${flattenKeyPath}[${indx}]`;
                    const lines = constructLines(JSON.stringify(actualJSON[indx], null, 2));
                    lines.forEach((line) => {
                        let modifiedLine = `  ${line}`;
                        if (modifiedLine.trim() !== "{") {
                            modifiedLine = modifiedLine + ",";
                        }
                        result.push({ count: -1, added: true, value: modifiedLine, flattenPath: elementPath });
                    });
                }
                result.push({ count: -1, value: ']', flattenPath: flattenKeyPath });
            }
            // Both objects
            else if (expectedJSON !== null && expectedJSON !== undefined &&
                actualJSON !== null && actualJSON !== undefined &&
                !Array.isArray(expectedJSON) && !Array.isArray(actualJSON)) {
                result.push({ count: -1, value: '{', flattenPath: flattenKeyPath });
                for (const key in expectedJSON) {
                    const nextPath = flattenKeyPath === "" ? `${key}` : `${flattenKeyPath}.${key}`;
                    if (key in actualJSON) {
                        const valueExpectedObj = expectedJSON[key];
                        const valueActualObj = actualJSON[key];
                        const output = CompareJSON(JSON.stringify(valueExpectedObj, null, 2), JSON.stringify(valueActualObj, null, 2), noise, nextPath);
                        if (valueActualObj == null && valueExpectedObj == null) {
                            result.push({ count: -1, value: `  ${key}: ${JSON.stringify(null)},`, flattenPath: nextPath });
                        }
                        else if (typeof valueExpectedObj === 'object' && (Array.isArray(valueExpectedObj) ? !Array.isArray(valueActualObj) : Array.isArray(valueActualObj))) {
                            if (noise.includes(nextPath)) {
                                const nOutput = noiseDiffArray(valueExpectedObj, valueActualObj, `  ${key}: `, nextPath);
                                nOutput.forEach((el) => {
                                    result.push(Object.assign(Object.assign({}, el), { noised: true }));
                                });
                            }
                            else {
                                result.push({ count: -1, removed: true, value: `  ${key}: ${JSON.stringify(valueExpectedObj, null, 2)},`, flattenPath: nextPath });
                                result.push({ count: -1, added: true, value: `  ${key}: ${JSON.stringify(valueActualObj, null, 2)},`, flattenPath: nextPath });
                            }
                        }
                        else if (typeof valueExpectedObj === 'object' && Array.isArray(valueExpectedObj)) {
                            result.push({ count: -1, value: `  ${key}: [\n`, flattenPath: nextPath });
                            output.forEach((res, resIndx) => {
                                if (resIndx > 0) {
                                    res.value = `  ${res.value}`;
                                    if (res.count === -2) {
                                        const tagStartIndex = res.value.indexOf('_keploy_|_keploy_');
                                        const tagLength = '_keploy_|_keploy_'.length;
                                        res.value = res.value.substring(0, tagStartIndex) + "_keploy_|_keploy_  " + res.value.substring(tagStartIndex + tagLength);
                                    }
                                    res.flattenPath = res.flattenPath || nextPath;
                                    result.push(res);
                                }
                            });
                        }
                        else if (typeof valueExpectedObj === 'object') {
                            result.push({ count: -1, value: `  ${key}: {\n`, flattenPath: nextPath });
                            output.forEach((res, resIndx) => {
                                if (resIndx > 0) {
                                    if (res.count === -2) {
                                        const tagStartIndex = res.value.indexOf('_keploy_|_keploy_');
                                        const tagLength = '_keploy_|_keploy_'.length;
                                        res.value = `  ${res.value.substring(0, tagStartIndex)}_keploy_|_keploy_  ${res.value.substring(tagStartIndex + tagLength)}`;
                                    }
                                    else {
                                        res.value = `  ${res.value}`;
                                    }
                                    res.flattenPath = res.flattenPath || nextPath;
                                    result.push(res);
                                }
                            });
                        }
                        else {
                            // primitive values
                            if (output.length === 1) {
                                if (output[0].count === -1) {
                                    result.push({ count: -1, value: `  ${key}: ${output[0].value},`, flattenPath: nextPath });
                                }
                                else {
                                    const tagStartIndex = output[0].value.indexOf('_keploy_|_keploy_');
                                    const tagLength = '_keploy_|_keploy_'.length;
                                    result.push({
                                        count: -2,
                                        noised: true,
                                        value: `  ${key}: ${output[0].value.substring(0, tagStartIndex)},_keploy_|_keploy_  ${key}: ${output[0].value.substring(tagStartIndex + tagLength)},`,
                                        flattenPath: nextPath
                                    });
                                }
                            }
                            else {
                                result.push({
                                    count: output[0].count,
                                    removed: output[0].removed,
                                    added: output[0].added,
                                    value: `  ${key}: ${output[0].value},`,
                                    noised: output[0].noised,
                                    flattenPath: nextPath
                                });
                                result.push({
                                    count: output[1].count,
                                    removed: output[1].removed,
                                    added: output[1].added,
                                    value: `  ${key}: ${output[1].value},`,
                                    noised: output[1].noised,
                                    flattenPath: nextPath
                                });
                            }
                        }
                    }
                    else {
                        // key missing in actual
                        result.push({ count: -1, removed: true, value: `  ${key}: ${JSON.stringify(expectedJSON[key], null, 2)},`, flattenPath: flattenKeyPath });
                    }
                }
                for (const key in actualJSON) {
                    if (result[result.length - 1].removed) {
                        result.push({ count: -3, value: "", flattenPath: flattenKeyPath });
                    }
                    if (!(key in expectedJSON)) {
                        result.push({ count: -1, added: true, value: `  ${key}: ${JSON.stringify(actualJSON[key], null, 2)},`, flattenPath: flattenKeyPath });
                    }
                }
                result.push({ count: -1, value: '}', flattenPath: flattenKeyPath });
            }
            else if (expectedJSON == null && actualJSON == null) {
                result.push({ count: -1, value: JSON.stringify(expectedJSON, null, 2), flattenPath: flattenKeyPath });
            }
            else {
                result.push({ count: -1, removed: true, value: JSON.stringify(expectedJSON, null, 2), flattenPath: flattenKeyPath });
                result.push({ count: -1, added: true, value: JSON.stringify(actualJSON, null, 2), flattenPath: flattenKeyPath });
            }
            break;
        }
    }
    return result;
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
const computeLineInformation = (oldString, newString, noise, disableWordDiff = false, compareMethod = DiffMethod.CHARS, linesOffset = 0) => {
    if (noise === null || noise === undefined) {
        noise = [];
    }
    let diffArray;
    let validJSON = "plain";
    try {
        JSON.parse(oldString);
        JSON.parse(newString);
        validJSON = "JSON";
    }
    catch (e) {
        // fall back to plain text diff if not valid JSON
    }
    if (validJSON === 'plain') {
        if (noise == null || noise.length == 0 || (noise.length > 0 && !noise.includes("body"))) {
            diffArray = diff.diffLines(oldString.trimRight(), newString.trimRight(), {
                newlineIsToken: true,
                ignoreWhitespace: false,
                ignoreCase: false,
            });
            if (diffArray.length === 1) {
                diffArray[0].count = -1;
            }
            diffArray.forEach(d => {
                if (d.flattenPath === undefined) {
                    d.flattenPath = "";
                }
            });
        }
        else {
            diffArray = noiseDiffArray(oldString, newString, "", "");
        }
    }
    else {
        diffArray = CompareJSON(oldString.trimRight(), newString.trimRight(), noise, "");
    }
    let rightLineNumber = linesOffset;
    let leftLineNumber = linesOffset;
    let lineInformation = [];
    let counter = 0;
    const diffLines = [];
    const ignoreDiffIndexes = [];
    const getLineInformation = (value, diffIndex, added, removed, noised, evaluateOnlyFirstLine, LineIndexTobeReturned) => {
        const lines = constructLines(value);
        return lines.map((line, lineIndex) => {
            if (ignoreDiffIndexes.includes(`${diffIndex}-${lineIndex}`)
                || (evaluateOnlyFirstLine && lineIndex !== 0) || diffArray[diffIndex].count === -3) {
                return undefined;
            }
            const left = {};
            const right = {};
            const currentFlattenPath = diffArray[diffIndex].flattenPath || "";
            if (added || removed) {
                if (!diffLines.includes(counter)) {
                    diffLines.push(counter);
                }
                if (removed) {
                    leftLineNumber += 1;
                    left.lineNumber = leftLineNumber;
                    left.type = DiffType.REMOVED;
                    left.value = line || ' ';
                    left.flattenPath = currentFlattenPath;
                    const nextDiff = diffArray[diffIndex + 1];
                    if (nextDiff && nextDiff.added) {
                        const nextDiffLines = constructLines(nextDiff.value)[lineIndex];
                        if (lineIndex < constructLines(nextDiff.value).length && lineIndex === lines.length - 1) {
                            lines.push(' ');
                        }
                        if (nextDiffLines) {
                            const nextLineInfo = getLineInformation(nextDiff.value, diffIndex + 1, true, false, nextDiff.noised);
                            const nextInfo = nextLineInfo[lineIndex];
                            if (nextInfo && nextInfo.right) {
                                ignoreDiffIndexes.push(`${diffIndex + 1}-${lineIndex}`);
                                right.lineNumber = nextInfo.right.lineNumber;
                                right.type = nextInfo.right.type;
                                right.flattenPath = nextDiff.flattenPath || "";
                                if (disableWordDiff) {
                                    right.value = nextInfo.right.value;
                                }
                                else {
                                    const computedDiff = computeDiff(line, nextInfo.right.value, compareMethod);
                                    computedDiff.left.forEach(l => { l.flattenPath = currentFlattenPath; });
                                    computedDiff.right.forEach(r => { r.flattenPath = currentFlattenPath; });
                                    right.value = computedDiff.right;
                                    left.value = computedDiff.left;
                                }
                            }
                        }
                    }
                }
                else {
                    rightLineNumber += 1;
                    right.lineNumber = rightLineNumber;
                    right.type = DiffType.ADDED;
                    right.value = line;
                    right.flattenPath = currentFlattenPath;
                }
            }
            else {
                // default lines
                if (diffArray[diffIndex].count === -1 || diffArray[diffIndex].count >= 0) {
                    leftLineNumber += 1;
                    rightLineNumber += 1;
                    left.lineNumber = leftLineNumber;
                    left.type = DiffType.DEFAULT;
                    right.lineNumber = rightLineNumber;
                    right.type = DiffType.DEFAULT;
                    left.value = line;
                    right.value = line;
                    left.flattenPath = currentFlattenPath;
                    right.flattenPath = currentFlattenPath;
                    if (noised) {
                        left.type = DiffType.NOISED;
                        right.type = DiffType.NOISED;
                    }
                }
                else if (diffArray[diffIndex].count === -2) {
                    const tagStartIndex = value.indexOf('_keploy_|_keploy_');
                    const tagLength = '_keploy_|_keploy_'.length;
                    leftLineNumber += 1;
                    rightLineNumber += 1;
                    left.lineNumber = leftLineNumber;
                    left.type = DiffType.DEFAULT;
                    right.lineNumber = rightLineNumber;
                    right.type = DiffType.DEFAULT;
                    left.value = line.substring(0, tagStartIndex);
                    right.value = line.substring(tagStartIndex + tagLength);
                    left.flattenPath = currentFlattenPath;
                    right.flattenPath = currentFlattenPath;
                    if (noised) {
                        left.type = DiffType.NOISED;
                        right.type = DiffType.NOISED;
                    }
                }
            }
            counter += 1;
            return { right, left };
        }).filter((item) => Boolean(item));
    };
    diffArray.forEach(({ added, removed, value, noised, flattenPath }, index) => {
        lineInformation = [
            ...lineInformation,
            ...getLineInformation(value, index, added, removed, noised),
        ];
    });
    return {
        lineInformation,
        diffLines,
    };
};
exports.computeLineInformation = computeLineInformation;
