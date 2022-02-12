"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeLineInformation = exports.DiffMethod = exports.DiffType = void 0;
var diff = require("diff");
var jsDiff = diff;
var DiffType;
(function (DiffType) {
    DiffType[DiffType["DEFAULT"] = 0] = "DEFAULT";
    DiffType[DiffType["ADDED"] = 1] = "ADDED";
    DiffType[DiffType["REMOVED"] = 2] = "REMOVED";
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
 * Splits diff text by new line and computes final list of diff lines based on
 * conditions.
 *
 * @param value Diff text from the js diff module.
 */
var constructLines = function (value) {
    if (value === undefined) {
        return [];
    }
    var lines = value.split('\n');
    var isAllEmpty = lines.every(function (val) { return !val; });
    if (isAllEmpty) {
        // This is to avoid added an extra new line in the UI.
        if (lines.length === 2) {
            return [];
        }
        lines.pop();
        return lines;
    }
    var lastLine = lines[lines.length - 1];
    var firstLine = lines[0];
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
var computeDiff = function (oldValue, newValue, compareMethod) {
    if (compareMethod === void 0) { compareMethod = DiffMethod.CHARS; }
    var diffArray = ((typeof compareMethod === 'string') ? jsDiff[compareMethod] : compareMethod)(oldValue, newValue);
    var computedDiff = {
        left: [],
        right: [],
    };
    diffArray.forEach(function (_a) {
        var added = _a.added, removed = _a.removed, value = _a.value;
        var diffInformation = {};
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
function jsonParse(val) {
    try {
        JSON.parse(val);
    }
    catch (e) {
        return val;
    }
    return JSON.parse(val);
}
function addNoiseTags(targetStr, tag, noise, noisyField) {
    var type;
    if (targetStr !== "") {
        type = typeof JSON.parse(targetStr);
    }
    // console.log("line 24",targetStr, noise[0], noise[1],noisyField)
    switch (type) {
        case "string": {
            if (noisyField) {
                targetStr = tag + JSON.parse(targetStr);
                //   console.log(targetStr)
            }
            break;
        }
        case "number": {
            if (noisyField) {
                targetStr = tag + JSON.parse(targetStr);
                // console.log(targetStr)
            }
            break;
        }
        case "boolean": {
            if (noisyField) {
                targetStr = tag + JSON.parse(targetStr);
                // console.log(targetStr)
            }
            break;
        }
        case "object": {
            var oldVal = JSON.parse(targetStr);
            if (oldVal === null) {
                //   console.log("&&&")
                if (noisyField) {
                    targetStr = tag + "null";
                    var type_1;
                    if (targetStr !== "") {
                        type_1 = typeof JSON.parse(targetStr);
                    }
                    // console.log("*line 142",targetStr)
                }
                return [targetStr];
            }
            if (Array.isArray(oldVal)) {
                // if (noisyField){
                //   targetStr = "keploy.noise.l"+targetStr
                //   newCod = "keploy.noise.r"+newCod
                //   break;
                // }
                oldVal = oldVal.map(function (el, elIndex) {
                    el = jsonParse(addNoiseTags(JSON.stringify(el), /*JSON.stringify(el),*/ tag, noise, noisyField)[0]);
                    // console.log("j",el)
                    return el;
                });
                //   console.log("***\n", oldVal)
                return [JSON.stringify(oldVal)];
            }
            else {
                if (noisyField) {
                    for (var k in oldVal) {
                        oldVal[k] = jsonParse(addNoiseTags(JSON.stringify(oldVal[k]), tag /*, JSON.stringify(oldVal[k])*/, noise, true)[0]);
                    }
                }
                if (noise != undefined && Array.isArray(noise)) {
                    Array.from(noise).forEach(function (el, elIndx) {
                        if (el != undefined) {
                            var dotIndx = el.indexOf(".");
                            if (dotIndx === -1) {
                                var key_1 = el.substring(0);
                                //   console.log("line 70",key)
                                var noiseTmp = [];
                                for (var i = 0; i < noise.length; i++) {
                                    if (noise[i] != undefined) {
                                        noiseTmp.push(noise[i].substring(noise[i].includes(".") ? noise[i].indexOf(".") + 1 : -1));
                                    }
                                    else {
                                        noiseTmp.push(noise[i]);
                                    }
                                }
                                delete noiseTmp[elIndx];
                                if (typeof oldVal === "object" && oldVal != null && key_1 in oldVal) {
                                    var repOld = addNoiseTags(JSON.stringify(oldVal[key_1]), tag, /*JSON.stringify(oldVal[key]),*/ noiseTmp, true);
                                    // console.log("line 79", repOld, JSON.parse( JSON.stringify(repOld[0])), oldVal[key])
                                    oldVal[key_1] = jsonParse(repOld[0]);
                                }
                            }
                            else {
                                var noiseTmp = [];
                                for (var i = 0; i < noise.length; i++) {
                                    if (noise[i] != undefined) {
                                        noiseTmp.push(noise[i].substring(noise[i].includes(".") ? noise[i].indexOf(".") + 1 : -1));
                                    }
                                    else {
                                        noiseTmp.push(noise[i]);
                                    }
                                }
                                noiseTmp[elIndx] = el.substring(dotIndx + 1);
                                var key = el.substring(0, dotIndx);
                                //   console.log("line 86",key)
                                if (oldVal != null && key in oldVal) {
                                    // console.log("bug 89")
                                    oldVal[key] = jsonParse(addNoiseTags(JSON.stringify(oldVal[key]), tag, /*JSON.stringify(oldVal[key]),*/ noiseTmp, noisyField)[0]);
                                }
                            }
                        }
                    });
                }
                return [JSON.stringify(oldVal, null, 2) /*,JSON.stringify(newVal)*/];
            }
            // break;
        }
        default: {
            if (noisyField) {
                targetStr = tag + JSON.parse(targetStr);
                //   console.log("*line 142",targetStr/*, newCod*/)
            }
            break;
        }
    }
    return [targetStr];
}
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
var computeLineInformation = function (oldString, newString, noise, disableWordDiff, compareMethod, linesOffset) {
    if (disableWordDiff === void 0) { disableWordDiff = false; }
    if (compareMethod === void 0) { compareMethod = DiffMethod.CHARS; }
    if (linesOffset === void 0) { linesOffset = 0; }
    var noiseTmp = [];
    for (var i = 0; i < noise.length; i++) {
        noiseTmp.push(noise[i]);
    }
    var expected = addNoiseTags(oldString, "keploy.noise.l", noiseTmp, false)[0];
    var actual = addNoiseTags(newString, "keploy.noise.r", noise, false)[0];
    console.log("exp and act");
    console.log(expected, actual);
    var diffArray = diff.diffLines(expected.trimRight(), actual.trimRight(), {
        newlineIsToken: true,
        ignoreWhitespace: false,
        ignoreCase: false,
    });
    console.log(diffArray);
    diffArray.forEach(function (element, elIndex) {
        if (element.value.includes("keploy.noise")) {
            element.added = undefined;
            element.removed = undefined;
        }
    });
    console.log(noise);
    var rightLineNumber = linesOffset;
    var leftLineNumber = linesOffset;
    var lineInformation = [];
    var counter = 0;
    var diffLines = [];
    var ignoreDiffIndexes = [];
    var getLineInformation = function (value, diffIndex, added, removed, evaluateOnlyFirstLine) {
        if (value.includes("keploy.noise")) {
            var stIgnore = value.indexOf("keploy.noise");
            value = value.substring(0, stIgnore) + value.substring(stIgnore + 14);
        }
        var lines = constructLines(value);
        return lines
            .map(function (line, lineIndex) {
            var left = {};
            var right = {};
            if (ignoreDiffIndexes.includes(diffIndex + "-" + lineIndex) ||
                (evaluateOnlyFirstLine && lineIndex !== 0)) {
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
                    var nextDiff = diffArray[diffIndex + 1];
                    if (nextDiff && nextDiff.added) {
                        var nextDiffLines = constructLines(nextDiff.value)[lineIndex];
                        if (nextDiffLines) {
                            var _a = getLineInformation(nextDiff.value, diffIndex, true, false, true)[0].right, rightValue_1 = _a.value, lineNumber = _a.lineNumber, type = _a.type;
                            // When identified as modification, push the next diff to ignore
                            // list as the next value will be added in this line computation as
                            // right and left values.
                            ignoreDiffIndexes.push(diffIndex + 1 + "-" + lineIndex);
                            right.lineNumber = lineNumber;
                            right.type = type;
                            // Do word level diff and assign the corresponding values to the
                            // left and right diff information object.
                            if (disableWordDiff) {
                                right.value = rightValue_1;
                            }
                            else {
                                var computedDiff = computeDiff(line, rightValue_1, compareMethod);
                                right.value = computedDiff.right;
                                left.value = computedDiff.left;
                            }
                        }
                    }
                }
                else {
                    rightLineNumber += 1;
                    right.lineNumber = rightLineNumber;
                    right.type = DiffType.ADDED;
                    right.value = line;
                }
            }
            else {
                if (diffArray[diffIndex].value.includes("keploy.noise.l")) {
                    leftLineNumber += 1;
                    rightLineNumber += 1;
                    left.lineNumber = leftLineNumber;
                    left.type = DiffType.DEFAULT;
                    right.lineNumber = rightLineNumber;
                    right.type = DiffType.DEFAULT;
                    left.value = line;
                    var rightValue;
                    if (diffArray[diffIndex + 1].value.includes("keploy.noise")) {
                        var stIgnore = diffArray[diffIndex + 1].value.indexOf("keploy.noise");
                        rightValue = diffArray[diffIndex + 1].value.substring(0, stIgnore) + diffArray[diffIndex + 1].value.substring(stIgnore + 14);
                        diffArray[diffIndex + 1].value = "keploy.noise";
                    }
                    // console.log("***", rightValue, diffArray[diffIndex+1].value, "***")
                    var rightLineToBeIgnored = constructLines(rightValue);
                    if (lineIndex <= rightLineToBeIgnored.length) {
                        right.value = rightLineToBeIgnored[lineIndex];
                        if (lineIndex === lines.length - 1) {
                            for (var i = lineIndex + 1; i < rightLineToBeIgnored.length; i++) {
                                lines.push(" ");
                            }
                        }
                    }
                }
                else if (!diffArray[diffIndex].value.includes("keploy.noise")) {
                    leftLineNumber += 1;
                    rightLineNumber += 1;
                    left.lineNumber = leftLineNumber;
                    left.type = DiffType.DEFAULT;
                    right.lineNumber = rightLineNumber;
                    right.type = DiffType.DEFAULT;
                    left.value = line;
                    right.value = line;
                }
                else if (diffArray[diffIndex].value.includes("keploy.noise.r")) {
                    leftLineNumber += 1;
                    rightLineNumber += 1;
                    left.lineNumber = leftLineNumber;
                    left.type = DiffType.DEFAULT;
                    right.lineNumber = rightLineNumber;
                    right.type = DiffType.DEFAULT;
                    right.value = line;
                    left.value = "";
                }
            }
            counter += 1;
            return { right: right, left: left };
        })
            .filter(Boolean);
    };
    diffArray.forEach(function (_a, index) {
        var added = _a.added, removed = _a.removed, value = _a.value;
        lineInformation = __spread(lineInformation, getLineInformation(value, index, added, removed));
    });
    return {
        lineInformation: lineInformation,
        diffLines: diffLines,
    };
};
exports.computeLineInformation = computeLineInformation;
