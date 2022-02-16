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
    value.replace(/\n,/gi, "\n");
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
    if (targetStr !== '') {
        type = typeof JSON.parse(targetStr);
    }
    // console.log("line 24",targetStr, noise[0], noise[1],noisyField)
    switch (type) {
        case 'string': {
            if (noisyField) {
                targetStr = tag + JSON.parse(targetStr);
                //   console.log(targetStr)
            }
            break;
        }
        case 'number': {
            if (noisyField) {
                targetStr = tag + JSON.parse(targetStr);
                // console.log(targetStr)
            }
            break;
        }
        case 'boolean': {
            if (noisyField) {
                targetStr = tag + JSON.parse(targetStr);
                // console.log(targetStr)
            }
            break;
        }
        case 'object': {
            var oldVal_1 = JSON.parse(targetStr);
            if (oldVal_1 === null) {
                //   console.log("&&&")
                if (noisyField) {
                    targetStr = tag + "null";
                    var type_1;
                    if (targetStr !== '') {
                        type_1 = typeof JSON.parse(targetStr);
                    }
                    console.log('*line 142', targetStr);
                }
                return [targetStr];
            }
            if (Array.isArray(oldVal_1)) {
                // if (noisyField){
                //   targetStr = "keploy.noise.l"+targetStr
                //   newCod = "keploy.noise.r"+newCod
                //   break;
                // }
                oldVal_1 = oldVal_1.map(function (el, elIndex) {
                    el = jsonParse(addNoiseTags(JSON.stringify(el), /* JSON.stringify(el), */ tag, noise, noisyField)[0]);
                    // console.log("j",el)
                    return el;
                });
                //   console.log("***\n", oldVal)
                return [JSON.stringify(oldVal_1)];
            }
            if (noisyField) {
                for (var k in oldVal_1) {
                    oldVal_1[k] = jsonParse(addNoiseTags(JSON.stringify(oldVal_1[k]), tag /* , JSON.stringify(oldVal[k]) */, noise, true)[0]);
                }
            }
            if (noise != undefined && Array.isArray(noise)) {
                Array.from(noise).forEach(function (el, elIndx) {
                    if (el != undefined) {
                        var dotIndx = el.indexOf('.');
                        if (dotIndx === -1) {
                            var key = el.substring(0);
                            //   console.log("line 70",key)
                            var noiseTmp = [];
                            for (var i = 0; i < noise.length; i++) {
                                if (noise[i] != undefined) {
                                    noiseTmp.push(noise[i].substring(noise[i].includes('.') ? noise[i].indexOf('.') + 1 : -1));
                                }
                                else {
                                    noiseTmp.push(noise[i]);
                                }
                            }
                            delete noiseTmp[elIndx];
                            if (typeof oldVal_1 === 'object' && oldVal_1 != null && key in oldVal_1) {
                                var repOld = addNoiseTags(JSON.stringify(oldVal_1[key]), tag, /* JSON.stringify(oldVal[key]), */ noiseTmp, true);
                                // console.log("line 79", repOld, JSON.parse( JSON.stringify(repOld[0])), oldVal[key])
                                oldVal_1[key] = jsonParse(repOld[0]);
                            }
                        }
                        else {
                            var noiseTmp = [];
                            for (var i = 0; i < noise.length; i++) {
                                if (noise[i] != undefined) {
                                    noiseTmp.push(noise[i].substring(noise[i].includes('.') ? noise[i].indexOf('.') + 1 : -1));
                                }
                                else {
                                    noiseTmp.push(noise[i]);
                                }
                            }
                            noiseTmp[elIndx] = el.substring(dotIndx + 1);
                            var key = el.substring(0, dotIndx);
                            //   console.log("line 86",key)
                            if (oldVal_1 != null && key in oldVal_1) {
                                // console.log("bug 89")
                                oldVal_1[key] = jsonParse(addNoiseTags(JSON.stringify(oldVal_1[key]), tag, /* JSON.stringify(oldVal[key]), */ noiseTmp, noisyField)[0]);
                            }
                        }
                    }
                });
            }
            return [JSON.stringify(oldVal_1, null, 2) /* ,JSON.stringify(newVal) */];
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
function noiseDiffArray(expectedObj, actualObj, key) {
    var result = [];
    var expectedLines = constructLines(JSON.stringify(expectedObj, null, 2));
    var actualLines = constructLines(JSON.stringify(actualObj, null, 2));
    expectedLines.map(function (el, elIndex) {
        if (elIndex < actualLines.length) {
            // add key only to the first line before and after seperator
            if (elIndex === 0) {
                result.push({ count: -2, value: key + el + "_keploy_|_keploy_" + key + actualLines[elIndex] });
            }
            else {
                result.push({ count: -2, value: "  " + el + "_keploy_|_keploy_  " + actualLines[elIndex] });
            }
        }
        // lines in expectedObj is greater than actualObj
        else if (elIndex === 0) {
            result.push({ count: -2, value: key + el + "_keploy_|_keploy_" + key });
        }
        else {
            result.push({ count: -2, value: "  " + el + "_keploy_|_keploy_ " });
        }
    });
    for (var indx = expectedLines.length; indx < actualLines.length; indx++) {
        if (indx === 0) {
            result.push({ count: -2, value: key + "_keploy_|_keploy_" + key + actualLines[indx] });
        }
        else {
            result.push({ count: -2, value: "  _keploy_|_keploy_  " + actualLines[indx] });
        }
    }
    return result;
}
function CompareJSON(expectedStr, actualStr, noise, flattenKeyPath) {
    var result = [];
    var expectedJSON = JSON.parse(expectedStr);
    var actualJSON = JSON.parse(actualStr);
    // expectedJSON and actualJSON are not of same data types
    if (typeof expectedJSON !== typeof actualJSON) {
        if (!noise.includes(flattenKeyPath)) {
            result.push({ count: -1, removed: true, value: expectedStr });
            result.push({ count: -1, added: true, value: actualStr });
            return result;
        }
        console.log(expectedStr, actualStr);
        var output = noiseDiffArray(expectedJSON, actualJSON, '');
        output.map(function (el) {
            result.push(el);
        });
        // result.push({count: -2, value: expectedStr+"_keploy_|_keploy_"+actualStr})
    }
    // expectedJSON and actualJSON are of same datatypes
    switch (typeof expectedJSON) {
        case 'string': {
            // matches
            if (expectedJSON === actualJSON) {
                result.push({ count: -1, value: expectedJSON });
                return result;
            }
            // not matched and ignored because its value of noise field
            if (noise.includes(flattenKeyPath)) {
                var output = noiseDiffArray(expectedJSON, actualJSON, '');
                output.map(function (el) {
                    result.push(el);
                });
                // result.push({count: -2, value: expectedStr+"_keploy_|_keploy_"+actualStr})
            }
            // not matches and not noisy field's value
            else {
                result.push({ count: -1, removed: true, value: expectedJSON });
                result.push({ count: -1, added: true, value: actualJSON });
                return result;
            }
            break;
        }
        case 'number': {
            // matches
            if (expectedJSON === actualJSON) {
                result.push({ count: -1, value: expectedStr });
                return result;
            }
            // not matched and ignored because its value of noise field
            if (noise.includes(flattenKeyPath)) {
                var output = noiseDiffArray(expectedJSON, actualJSON, '');
                output.map(function (el) {
                    result.push(el);
                });
                // result.push({count: -2, value: expectedStr+"_keploy_|_keploy_"+actualStr})
            }
            // not matches and not noisy field's value
            else {
                result.push({ count: -1, removed: true, value: expectedStr });
                result.push({ count: -1, added: true, value: actualStr });
                return result;
            }
            break;
        }
        case 'boolean': {
            // matches
            if (expectedStr === actualStr) {
                result.push({ count: -1, value: expectedStr });
                return result;
            }
            // not matched and ignored because its value of noise field
            if (noise.includes(flattenKeyPath)) {
                var output = noiseDiffArray(expectedJSON, actualJSON, '');
                output.map(function (el) {
                    result.push(el);
                });
                // result.push({count: -2, value: expectedStr+"_keploy_|_keploy_"+actualStr})
            }
            // not matches and not noisy field's value
            else {
                result.push({ count: -1, removed: true, value: expectedStr });
                result.push({ count: -1, added: true, value: actualStr });
                return result;
            }
            break;
        }
        case 'object': {
            // this is the value of a noise field therefore, it should be of type default.
            if (noise.includes(flattenKeyPath)) {
                var output = noiseDiffArray(expectedJSON, actualJSON, '');
                output.map(function (el) {
                    result.push(el);
                });
                // let linesExpected = constructLines(JSON.stringify(expectedJSON, null, 2))
                // let linesActual   = constructLines(JSON.stringify(actualJSON, null, 2))
                // linesExpected.map((el, elIndex)=>{
                // 	if(elIndex < linesActual.length){
                // 		result.push({count: -2, value:el+"_keploy_|_keploy_"+linesActual[elIndex]})
                // 	}
                // 	else{
                // 		result.push({count: -2, value:el+"_keploy_|_keploy_ "})
                // 	}
                // })
                // for(let indx = linesExpected.length; indx<linesActual.length ;indx++){
                // 	result.push({count: -2, value:" _keploy_|_keploy_"+linesActual[indx]})
                // }
                return result;
            }
            // when both are arrays
            if (Array.isArray(expectedJSON) && Array.isArray(actualJSON)) {
                result.push({ count: -1, value: '[' });
                expectedJSON.map(function (el, elIndx) {
                    if (elIndx < actualJSON.length) {
                        var output = CompareJSON(JSON.stringify(el, null, 2), JSON.stringify(actualJSON[elIndx], null, 2), noise, flattenKeyPath);
                        output.map(function (res) {
                            res.value = "  " + res.value;
                            if (res.value[res.value.length - 1] != ',' && res.value.substring(res.value.length - 2) !== '\n') {
                                res.value += ',';
                            }
                            res.value = res.value.replace(/\n,/gi, '\n');
                            result.push(res);
                        });
                    }
                    // add extra elements of expectedStr as of type removed
                    else {
                        var lines = constructLines(JSON.stringify(el, null, 2));
                        lines.map(function (line, _lineIndex) {
                            line = "  " + line + ",";
                            line = line.replace(/\n,/gi, '\n');
                            result.push({ count: -1, removed: true, value: line });
                        });
                        // result.push({count: -1, removed: true, value: JSON.stringify(el, null, 2)+","})
                    }
                });
                // add extra elements of actualStr as added type
                for (var indx = expectedJSON.length; indx < actualJSON.length; indx++) {
                    var lines = constructLines(JSON.stringify(actualJSON[indx], null, 2));
                    lines.map(function (line, _lineIndex) {
                        line = "  " + line + ",";
                        line = line.replace(/\n,/gi, '\n');
                        result.push({ count: -1, removed: true, value: line });
                    });
                    // result.push({count: -1, added: true, value: JSON.stringify(actualJSON[indx], null, 2)+","})
                }
                result.push({ count: -1, value: ']' });
            }
            // both are objects and not null
            else if (expectedJSON !== null && expectedJSON !== undefined && actualJSON !== null && actualJSON !== undefined && !Array.isArray(expectedJSON) && !Array.isArray(actualJSON)) {
                result.push({ count: -1, value: '{' });
                for (var key in expectedJSON) {
                    // key present in both
                    if (key in actualJSON) {
                        var valueExpectedObj = expectedJSON[key];
                        var valueActualObj = actualJSON[key];
                        // type of value in expectedJSON for key is of same type as value in actualJSON.
                        if (typeof valueActualObj === typeof valueExpectedObj) {
                            var output = CompareJSON(JSON.stringify(valueExpectedObj, null, 2), JSON.stringify(valueActualObj, null, 2), noise, flattenKeyPath + "." + key);
                            // values of keys in expectedJSON and actualJSON are null.
                            if (valueActualObj == null && valueExpectedObj == null) {
                                result.push({ count: -1, value: "  " + key + ": " + JSON.stringify(null) + "," });
                            }
                            // type of one is array and other is object.
                            else if (typeof valueExpectedObj === 'object' && (Array.isArray(valueExpectedObj) ? !Array.isArray(valueActualObj) : Array.isArray(valueActualObj))) {
                                if (noise.includes(flattenKeyPath + "." + key)) {
                                    var output_1 = noiseDiffArray(valueExpectedObj, valueActualObj, "  " + key + ": ");
                                    output_1.map(function (el) {
                                        result.push(el);
                                    });
                                }
                                else {
                                    result.push({ count: -1, removed: true, value: "  " + key + ": " + JSON.stringify(valueExpectedObj, null, 2) + "," });
                                    result.push({ count: -1, added: true, value: "  " + key + ": " + JSON.stringify(valueActualObj, null, 2) + "," });
                                }
                            }
                            else if (typeof valueExpectedObj === 'object' && Array.isArray(valueExpectedObj)) {
                                result.push({ count: -1, value: "  " + key + ": [\n" });
                                output.map(function (res, resIndx) {
                                    if (resIndx > 0
                                    // && resIndx<output.length-1
                                    ) {
                                        res.value = "  " + res.value;
                                        if (res.value[res.value.length - 1] != ',' && res.value.substring(res.value.length - 2) !== '\n') {
                                            res.value += ',';
                                        }
                                        console.log('in nested array', res);
                                        result.push(res);
                                    }
                                });
                                // result.push({count: -1, value: "\n  ],"})
                            }
                            else if (typeof valueExpectedObj === 'object') {
                                result.push({ count: -1, value: "  " + key + ": {\n" });
                                output.map(function (res, resIndx) {
                                    if (resIndx > 0
                                    //  && resIndx<output.length-1
                                    ) {
                                        res.value = "  " + res.value;
                                        if (res.value[res.value.length - 1] != ',' && res.value.substring(res.value.length - 2) !== '\n') {
                                            res.value += ',';
                                        }
                                        result.push(res);
                                    }
                                });
                                // result.push({count: -1, value: "\n  },"})
                            }
                            else {
                                // result.push({count: -1, value: key+": "})
                                if (output.length === 1) {
                                    if (output[0].count === -1) {
                                        result.push({ count: -1, value: "  " + key + ": " + output[0].value + "," });
                                    }
                                    else {
                                        var tagStartIndex = output[0].value.indexOf('_keploy_|_keploy_');
                                        var tagLength = '_keploy_|_keploy_'.length;
                                        result.push({ count: -2, value: "  " + key + ": " + output[0].value.substring(0, tagStartIndex) + "_keploy_|_keploy_" + ("  " + key + ": " + output[0].value.substring(tagStartIndex + tagLength)) });
                                    }
                                }
                                else {
                                    result.push({
                                        count: output[0].count,
                                        removed: output[0].removed,
                                        added: output[0].added,
                                        value: "  " + key + ": " + output[0].value + ",",
                                    });
                                    result.push({
                                        count: output[1].count,
                                        removed: output[1].removed,
                                        added: output[1].added,
                                        value: "  " + key + ": " + output[1].value + ",",
                                    });
                                }
                                // output.map((res) => {
                                // 	result.push(res)
                                // })
                            }
                        }
                        else {
                            if (!noise.includes(flattenKeyPath + "." + key)) {
                                result.push({ count: -1, removed: true, value: "  " + key + ": " + JSON.stringify(valueExpectedObj, null, 2) + "," });
                                result.push({ count: -1, added: true, value: "  " + key + ": " + JSON.stringify(valueActualObj, null, 2) + "," });
                            }
                            else {
                                result.push({ count: -2, value: "  " + key + ": " + JSON.stringify(valueExpectedObj, null, 2) + "_keploy_|_keploy_" + ("  " + key + ": " + JSON.stringify(valueActualObj, null, 2)) });
                            }
                            // result.push({count: -1, value: key+": "})
                            // output.map((res) => {
                            // 	result.push(res)
                            // })
                        }
                    }
                    else {
                        result.push({ count: -1, removed: true, value: "  " + key + ": " + JSON.stringify(expectedJSON[key], null, 2) + "," });
                    }
                }
                for (var key in actualJSON) {
                    if (!(key in expectedJSON)) {
                        result.push({ count: -1, added: true, value: "  " + key + ": " + JSON.stringify(actualJSON[key], null, 2) + "," });
                    }
                }
                result.push({ count: -1, value: '}' });
            }
            else if (expectedJSON == null && actualJSON == null) {
                result.push({ count: -1, value: JSON.stringify(expectedJSON, null, 2) });
            }
            else {
                result.push({ count: -1, removed: true, value: JSON.stringify(expectedJSON, null, 2) });
                result.push({ count: -1, added: true, value: JSON.stringify(actualJSON, null, 2) });
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
    // let expectedStr =  addNoiseTags(oldString, "keploy.noise.l", noiseTmp, false)[0] as string
    // let actualStr = addNoiseTags(newString, "keploy.noise.r", noise, false)[0]  as string
    // console.log("exp and act")
    // console.log( expectedStr, actualStr)
    var diffArray = CompareJSON(oldString.trimRight(), newString.trimRight(), noise, 'body');
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
            line = line.replace(/\n,/gi, "\n");
            // if (evaluateOnlyFirstLine && lineIndex === 0 && added) {
            // 	let str = diffArray[diffIndex + 1].value, indexofNewLine=str.indexOf("\n");
            // 	if(indexofNewLine!==-1){
            // 		diffArray[diffIndex + 1].value = str.substring(indexofNewLine + 1)+"\nr";
            // 	}
            // 	else{
            // 		line = str
            // 	}
            // }
            if (ignoreDiffIndexes.includes(diffIndex + "-" + lineIndex)
                || (evaluateOnlyFirstLine && lineIndex !== 0)) {
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
                            lines.push(' ');
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
                if (diffArray[diffIndex].count === -1) {
                    leftLineNumber += 1;
                    rightLineNumber += 1;
                    left.lineNumber = leftLineNumber;
                    left.type = DiffType.DEFAULT;
                    right.lineNumber = rightLineNumber;
                    right.type = DiffType.DEFAULT;
                    left.value = line;
                    right.value = line;
                }
                else {
                    var tagStartIndex = value.indexOf('_keploy_|_keploy_');
                    var tagLength = '_keploy_|_keploy_'.length;
                    console.log('index of differentiator : ', tagStartIndex, ' length of differentiator : ', tagLength);
                    leftLineNumber += 1;
                    rightLineNumber += 1;
                    left.lineNumber = leftLineNumber;
                    left.type = DiffType.DEFAULT;
                    right.lineNumber = rightLineNumber;
                    right.type = DiffType.DEFAULT;
                    left.value = line.substring(0, tagStartIndex);
                    right.value = line.substring(tagStartIndex + tagLength);
                }
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
