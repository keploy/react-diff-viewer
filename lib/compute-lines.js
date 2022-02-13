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
                    console.log("*line 142", targetStr);
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
function CompareJSON(expected, actual, noise) {
    var result = [];
    var expectedValue = JSON.parse(expected), actualValue = JSON.parse(actual);
    // type not matches
    if (typeof expectedValue !== typeof actualValue) {
        result.push({ count: -1, removed: true, value: expected });
        result.push({ count: -1, added: true, value: actual });
        return result;
    }
    switch (typeof expectedValue) {
        case "string": {
            if (expected === actual) {
                result.push({ count: -1, value: expected });
                return result;
            }
            else {
                result.push({ count: -1, removed: true, value: expected });
                result.push({ count: -1, added: true, value: actual });
                return result;
            }
            break;
        }
        case "number": {
            if (expected === actual) {
                result.push({ count: -1, value: expected });
                return result;
            }
            else {
                result.push({ count: -1, removed: true, value: expected });
                result.push({ count: -1, added: true, value: actual });
                return result;
            }
            break;
        }
        case "boolean": {
            if (expected === actual) {
                result.push({ count: -1, value: expected });
                return result;
            }
            else {
                result.push({ count: -1, removed: true, value: expected });
                result.push({ count: -1, added: true, value: actual });
                return result;
            }
            break;
        }
        case "object": {
            if (Array.isArray(expectedValue) && Array.isArray(actualValue)) {
                result.push({ count: -1, value: "[" });
                expectedValue.map(function (el, elIndx) {
                    if (elIndx < actualValue.length) {
                        var output = CompareJSON(JSON.stringify(el, null, 2), JSON.stringify(actualValue[elIndx], null, 2), noise);
                        output.map(function (res) {
                            result.push(res);
                        });
                    }
                    else {
                        result.push({ count: -1, removed: true, value: JSON.stringify(el, null, 2) });
                    }
                });
                for (var indx = expectedValue.length; indx < actualValue.length; indx++) {
                    result.push({ count: -1, added: true, value: JSON.stringify(actualValue[indx], null, 2) });
                }
                result.push({ count: -1, value: "]" });
            }
            else if (expectedValue !== null && expectedValue !== undefined && actualValue !== null && actualValue !== undefined) {
                result.push({ count: -1, value: "{" });
                var _loop_1 = function (key) {
                    if (key in actualValue) {
                        var valueExpectedObj = expectedValue[key], valueActualObj = actualValue[key];
                        if (typeof valueActualObj === typeof valueExpectedObj) {
                            var output_1 = CompareJSON(JSON.stringify(valueExpectedObj, null, 2), JSON.stringify(valueActualObj, null, 2), noise);
                            if (valueActualObj == null && valueExpectedObj == null) {
                                result.push({ count: -1, value: "  " + key + ": " + JSON.stringify(null) });
                            }
                            else if (typeof valueExpectedObj === "object" && (Array.isArray(valueExpectedObj) ? !Array.isArray(valueActualObj) : Array.isArray(valueActualObj))) {
                                result.push({ count: -1, removed: true, value: "  " + key + ": " + JSON.stringify(valueExpectedObj, null, 2) });
                                result.push({ count: -1, added: true, value: "  " + key + ": " + JSON.stringify(valueActualObj, null, 2) });
                            }
                            else if (typeof valueExpectedObj === "object" && Array.isArray(valueExpectedObj)) {
                                result.push({ count: -1, value: "  " + key + ": [\n" });
                                output_1.map(function (res, resIndx) {
                                    if (resIndx > 0 && resIndx < output_1.length - 1) {
                                        result.push(res);
                                    }
                                });
                                result.push({ count: -1, value: "\n]" });
                            }
                            else if (typeof valueExpectedObj === "object") {
                                result.push({ count: -1, value: "  " + key + ": {\n" });
                                output_1.map(function (res, resIndx) {
                                    if (resIndx > 0 && resIndx < output_1.length - 1) {
                                        result.push(res);
                                    }
                                });
                                result.push({ count: -1, value: "\n}" });
                            }
                            else {
                                // result.push({count: -1, value: key+": "})
                                if (output_1.length === 1) {
                                    result.push({ count: -1, value: "  " + key + ": " + output_1[0].value });
                                }
                                else {
                                    result.push({
                                        count: -1,
                                        removed: output_1[0].removed,
                                        added: output_1[0].added,
                                        value: "  " + key + ": " + output_1[0].value
                                    });
                                    result.push({
                                        count: -1,
                                        removed: output_1[1].removed,
                                        added: output_1[1].added,
                                        value: "  " + key + ": " + output_1[1].value
                                    });
                                }
                                // output.map((res) => {
                                // 	result.push(res)
                                // })
                            }
                        }
                        else {
                            result.push({ count: -1, removed: true, value: "  " + key + ": " + JSON.stringify(valueExpectedObj, null, 2) });
                            result.push({ count: -1, added: true, value: "  " + key + ": " + JSON.stringify(valueActualObj, null, 2) });
                            // result.push({count: -1, value: key+": "})
                            // output.map((res) => {
                            // 	result.push(res)
                            // })
                        }
                    }
                    else {
                        result.push({ count: -1, removed: true, value: "  " + key + ": " + JSON.stringify(expectedValue[key], null, 2) });
                    }
                };
                for (var key in expectedValue) {
                    _loop_1(key);
                }
                for (var key in actualValue) {
                    if (!(key in expectedValue)) {
                        result.push({ count: -1, added: true, value: "  " + key + ": " + JSON.stringify(actualValue[key], null, 2) });
                    }
                }
                result.push({ count: -1, value: "}" });
            }
            else {
                if (expectedValue == null && actualValue == null) {
                    result.push({ count: -1, value: expectedValue });
                }
                else {
                    result.push({ count: -1, removed: true, value: expectedValue });
                    result.push({ count: -1, added: true, value: actualValue });
                }
            }
            break;
        }
    }
    return result;
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
    // let noiseTmp:string[] = []
    // for(let i=0; i<noise.length ;i++){
    // 	noiseTmp.push(noise[i])
    // }
    // let expected =  addNoiseTags(oldString, "keploy.noise.l", noiseTmp, false)[0] as string
    // let actual = addNoiseTags(newString, "keploy.noise.r", noise, false)[0]  as string
    // console.log("exp and act")
    // console.log( expected, actual)
    var diffArray = CompareJSON(oldString.trimRight(), newString.trimRight(), noise
    // {
    // 	newlineIsToken: true,
    // 	ignoreWhitespace: false,
    // 	ignoreCase: false,
    // },
    );
    // [
    // 	{
    // 		added: Boolean,
    // 		removed: Boolean,
    // 		count: 1234,
    // 		value: "{ "name": "ritik,"\n "age ": 21"
    // 	},
    // 	{
    // 		removed: true,
    // 		count: 1,
    // 		value: "contact: "keploy.noise.l78278782892", \n"
    // 	},
    // 	{
    // 		added: true,
    // 		count: 1,
    // 		value: "contact: "keploy.noise.r7827212052", \n"
    // 	},
    // ]
    console.log(diffArray);
    // diffArray.forEach((element, elIndex) => {
    // 	if (element.value.includes("keploy.noise")){
    // 		element.added = undefined
    // 		element.removed = undefined
    // 	}
    // });
    console.log(noise);
    var rightLineNumber = linesOffset;
    var leftLineNumber = linesOffset;
    var lineInformation = [];
    var counter = 0;
    var diffLines = [];
    var ignoreDiffIndexes = [];
    var getLineInformation = function (value, diffIndex, added, removed, evaluateOnlyFirstLine, LineIndexTobeReturned) {
        // while (value.includes("keploy.noise")){
        // 	const stIgnore = value.indexOf("keploy.noise")
        // 	value = value.substring(0, stIgnore) + value.substring(stIgnore+14)
        // }
        var lines = constructLines(value);
        return lines
            .map(function (line, lineIndex) {
            var left = {};
            var right = {};
            // if (evaluateOnlyFirstLine && lineIndex === 0 && added) {
            // 	let str = diffArray[diffIndex + 1].value, indexofNewLine=str.indexOf("\n");
            // 	if(indexofNewLine!==-1){
            // 		diffArray[diffIndex + 1].value = str.substring(indexofNewLine + 1)+"\nr";
            // 	}
            // 	else{
            // 		line = str
            // 	}
            // }
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
                    // console.log(left.value)
                    // When the current line is of type REMOVED, check the next item in
                    // the diff array whether it is of type ADDED. If true, the current
                    // diff will be marked as both REMOVED and ADDED. Meaning, the
                    // current line is a modification.
                    var nextDiff = diffArray[diffIndex + 1];
                    if (nextDiff && nextDiff.added) {
                        var nextDiffLines = constructLines(nextDiff.value)[lineIndex];
                        if (lineIndex < constructLines(nextDiff.value).length && lineIndex === lines.length - 1) {
                            lines.push(" ");
                        }
                        // console.log()
                        if (nextDiffLines) {
                            var _a = getLineInformation(nextDiff.value, diffIndex, true, false)[lineIndex].right, rightValue = _a.value, lineNumber = _a.lineNumber, type = _a.type;
                            // console.log(left.value, ", ", rightValue)
                            // When identified as modification, push the next diff to ignore
                            // list as the next value will be added in this line computation as
                            // right and left values.
                            ignoreDiffIndexes.push(diffIndex + 1 + "-" + lineIndex);
                            right.lineNumber = lineNumber;
                            right.type = type;
                            // Do word level diff and assign the corresponding values to the
                            // left and right diff information object.
                            if (disableWordDiff) {
                                right.value = rightValue;
                            }
                            else {
                                var computedDiff = computeDiff(line, rightValue, compareMethod);
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
                // if (diffArray[diffIndex].value.includes("keploy.noise.l")){
                // 	leftLineNumber += 1;
                // 	rightLineNumber += 1;
                // 	left.lineNumber = leftLineNumber;
                // 	left.type = DiffType.DEFAULT;
                // 	right.lineNumber = rightLineNumber;
                // 	right.type = DiffType.DEFAULT;
                // 	left.value = line;
                // 	var rightValue
                // 	if (diffArray[diffIndex+1].value.includes("keploy.noise")){
                // 		const stIgnore = diffArray[diffIndex+1].value.indexOf("keploy.noise")
                // 		rightValue = diffArray[diffIndex+1].value.substring(0, stIgnore) + diffArray[diffIndex+1].value.substring(stIgnore+14)
                // 		diffArray[diffIndex+1].value = "keploy.noise"
                // 		console.log(diffArray[diffIndex+1].value)
                // 	}
                // 	// console.log("***", rightValue, diffArray[diffIndex+1].value, "***")
                // 	const rightLineToBeIgnored = constructLines(rightValue);
                // 	if (lineIndex <= rightLineToBeIgnored.length){
                // 		right.value = rightLineToBeIgnored[lineIndex]
                // 		if (lineIndex === lines.length-1){
                // 			for(var i=lineIndex+1; i<rightLineToBeIgnored.length ;i++){
                // 				lines.push(" ")
                // 			}
                // 		}
                // 	} 
                // } 
                // else if(!diffArray[diffIndex].value.includes("keploy.noise")) {
                leftLineNumber += 1;
                rightLineNumber += 1;
                left.lineNumber = leftLineNumber;
                left.type = DiffType.DEFAULT;
                right.lineNumber = rightLineNumber;
                right.type = DiffType.DEFAULT;
                left.value = line;
                right.value = line;
                // }
                // else if(diffArray[diffIndex].value.includes("keploy.noise.r")){
                // 	leftLineNumber += 1;
                // 	rightLineNumber += 1;
                // 	left.lineNumber = leftLineNumber;
                // 	left.type = DiffType.DEFAULT;
                // 	right.lineNumber = rightLineNumber;
                // 	right.type = DiffType.DEFAULT;
                // 	right.value = line
                // 	left.value = ""
                // }
            }
            // leftLineNumber += 1;
            // rightLineNumber += 1;
            // left.lineNumber = leftLineNumber
            // right.lineNumber = rightLineNumber
            // left.type = DiffType.REMOVED
            // right.type = DiffType.ADDED
            // left.value = "  vas\n holi"
            // right.value = "  vas\n holi"
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
