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
import * as diff from 'diff';
import { string } from 'prop-types';

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
  if (value === undefined) {
    return [];
  }
  value = value.replace(/\n,/gi, "\n")
  if(value.trim() === ","){
    value = ""
  }
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

function noiseDiffArray(expectedObj: any, actualObj: any, key: string): diff.Change[] {
  const result: diff.Change[] = [];
  const expectedLines = constructLines(JSON.stringify(expectedObj, null, 2)); 
  const actualLines = constructLines(JSON.stringify(actualObj, null, 2));
  expectedLines.map((el, elIndex) => {
    // to handle common length of both lines array.
    if (elIndex < actualLines.length) {
      // add key only to the first line before and after seperator.
      if(elIndex === 0){
        result.push({ count: -2, value: `${key + el}_keploy_|_keploy_${key}${actualLines[elIndex]}` });
      }
      else{
        result.push({ count: -2, value: `  ${el}_keploy_|_keploy_  ${actualLines[elIndex]}`})
      }
      
    }
    // lines in expectedObj is greater than actualObj and add key string only to the first line.
    // example: expectedObj: "", actualObj: "[1, 2, true]"
    else if ( elIndex === 0) {
      result.push({ count: -2, value: `${key + el}_keploy_|_keploy_${key}` });
    }
    else{
      result.push({ count: -2, value: `  ${el}_keploy_|_keploy_` });
		}
    
  });
  for (let indx = expectedLines.length; indx < actualLines.length; indx++) {
    // lines in actual object is greater than expected object.
    // example: expectedObj: "[1, 2, true]", actualObj: ""

    if ( indx === 0) {
      result.push({ count: -2, value: `${key}_keploy_|_keploy_${key}${actualLines[indx]}` });
    }
    else{
      result.push({ count: -2, value: `_keploy_|_keploy_  ${actualLines[indx]}` });
    }
  }
  return result;
}

function CompareJSON(expectedStr: string, actualStr: string, noise: string[], flattenKeyPath: string): diff.Change[] {
  const result: diff.Change[] = [];
  const expectedJSON = JSON.parse(expectedStr); 
  const actualJSON = JSON.parse(actualStr);

  // expectedJSON and actualJSON are not of same data types
  if (typeof expectedJSON !== typeof actualJSON) {
    if (!noise.includes(flattenKeyPath)) {
      result.push({ count: -1, removed: true, value: JSON.stringify(expectedJSON, null, 2) });
      result.push({ count: -1, added: true, value: JSON.stringify(actualJSON, null, 2) });
      return result;
    }

    // console.log(expectedStr, actualStr);
    const output = noiseDiffArray(expectedJSON, actualJSON, '');
    output.map((el) => {
      result.push(el);
    });
    return result
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
        const output = noiseDiffArray(expectedJSON, actualJSON, '');
        output.map((el) => {
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
        const output = noiseDiffArray(expectedJSON, actualJSON, '');
        output.map((el) => {
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
        const output = noiseDiffArray(expectedJSON, actualJSON, '');
        output.map((el) => {
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
        const output = noiseDiffArray(expectedJSON, actualJSON, '');
        output.map((el) => {
          result.push(el);
        });
        return result;
      }
      // when both are arrays
      if (Array.isArray(expectedJSON) && Array.isArray(actualJSON)) {
        result.push({ count: -1, value: '[' });

        expectedJSON.map((el, elIndx) => {

          // comparing common length elements in both arrays
          if (elIndx < actualJSON.length) {
            const output = CompareJSON(JSON.stringify(el, null, 2), JSON.stringify(actualJSON[elIndx], null, 2), noise, flattenKeyPath);
            output.map((res) => {
              res.value = `  ${res.value}`;
              if (res.count === -2){
                const tagStartIndex = res.value.indexOf('_keploy_|_keploy_'); 
                const tagLength = '_keploy_|_keploy_'.length;
                res.value = res.value.substring(0, tagStartIndex) +"_keploy_|_keploy_  "+res.value.substring(tagStartIndex + tagLength);
              }

              if (res.value[res.value.length - 1] != ',' && res.value.trim() !== "{" && !res.value.endsWith("_keploy_|_keploy_")) {
                res.value += ',';
              }
              result.push(res);
            });
          }
          // handling extra elements of expectedStr as of type removed
          else {
            const lines = constructLines(JSON.stringify(el, null, 2));
            lines.map((line, _lineIndex) => {
              line = `  ${line}`;
              if( line.trim() !== "{" ){
                line = line + ","
              }
              result.push({ count: -1, removed: true, value: line });
            });
            // result.push({count: -1, removed: true, value: JSON.stringify(el, null, 2)+","})
          }

        });

        // handling extra elements of actualStr as added type
        for (let indx = expectedJSON.length; indx < actualJSON.length; indx++) {
          // if last element of result is of removed type than there should be gap between added otherwise it will be considered as modification.
          if( result[result.length-1].removed ){
            result.push({count: -3, value: ""})
          }

          const lines = constructLines(JSON.stringify(actualJSON[indx], null, 2));
          lines.map((line, _lineIndex) => {
            line = `  ${line}`;
            if( line.trim() !== "{" ){
              line = line + ","
            }
            result.push({ count: -1, added: true, value: line });
          });
          // result.push({count: -1, added: true, value: JSON.stringify(actualJSON[indx], null, 2)+","})
        }

        result.push({ count: -1, value: ']' });
      }
      // both are objects and not null
      else if (expectedJSON !== null && expectedJSON !== undefined && actualJSON !== null && actualJSON !== undefined && !Array.isArray(expectedJSON) && !Array.isArray(actualJSON)) {
        result.push({ count: -1, value: '{' });

        for (const key in expectedJSON) {

          // key present in both
          if (key in actualJSON) {
            const valueExpectedObj = expectedJSON[key]; 
            const valueActualObj = actualJSON[key];
            // type of value in expectedJSON for key is of same type as value in actualJSON.
            if (typeof valueActualObj === typeof valueExpectedObj) {
              const output = CompareJSON(JSON.stringify(valueExpectedObj, null, 2), JSON.stringify(valueActualObj, null, 2), noise, `${flattenKeyPath}.${key}`);

              // values of keys in expectedJSON and actualJSON are null.
              if (valueActualObj == null && valueExpectedObj == null) {
                result.push({ count: -1, value: `  ${key}: ${JSON.stringify(null)},` });
              }
              // type of one is array and other is object.
              else if (typeof valueExpectedObj === 'object' && (Array.isArray(valueExpectedObj) ? !Array.isArray(valueActualObj) : Array.isArray(valueActualObj))) {
			      	  if (noise.includes(`${flattenKeyPath}.${key}`)){
                  const output = noiseDiffArray(valueExpectedObj, valueActualObj, `  ${key}: `);
                  output.map((el) => {
					          result.push(el);
                  });
                }
                else {
                  result.push({ count: -1, removed: true, value: `  ${key}: ${JSON.stringify(valueExpectedObj, null, 2)},` });
                  result.push({ count: -1, added: true, value: `  ${key}: ${JSON.stringify(valueActualObj, null, 2)},` });
                }
              }
              // both values of key-value pairs are of array datatype.
              else if (typeof valueExpectedObj === 'object' && Array.isArray(valueExpectedObj)) {
                result.push({ count: -1, value: `  ${key}: [\n` });

                output.map((res, resIndx) => {
                  if ( resIndx > 0 ) {
                    res.value = `  ${res.value}`;
                    if (res.count === -2){
                      const tagStartIndex = res.value.indexOf('_keploy_|_keploy_'); 
                      const tagLength = '_keploy_|_keploy_'.length;
                      res.value = res.value.substring(0, tagStartIndex) +"_keploy_|_keploy_  "+res.value.substring(tagStartIndex + tagLength);
                    }
                    result.push(res);
                  }
                });

              } 
              // both values are objects.
              else if (typeof valueExpectedObj === 'object') {
                result.push({ count: -1, value: `  ${key}: {\n` });

                output.map((res, resIndx) => {
                  if (resIndx > 0) {

                    if (res.count === -2){
                      const tagStartIndex = res.value.indexOf('_keploy_|_keploy_'); 
                      const tagLength = '_keploy_|_keploy_'.length;
                      res.value = `  ${res.value.substring(0, tagStartIndex)}_keploy_|_keploy_  ${res.value.substring(tagStartIndex + tagLength)}`
                    }
                    else{
                      res.value = `  ${res.value}`;
                    }

                    result.push(res);
                  }
                });

              } else {

                if (output.length === 1) {

                  if (output[0].count === -1) {
                    result.push({ count: -1, value: `  ${key}: ${output[0].value},` });
                  } else {
                    const tagStartIndex = output[0].value.indexOf('_keploy_|_keploy_'); 
                    const tagLength = '_keploy_|_keploy_'.length;
                    result.push({ count: -2, value: `  ${key}: ${output[0].value.substring(0, tagStartIndex)},_keploy_|_keploy_` + `  ${key}: ${output[0].value.substring(tagStartIndex + tagLength)},` });
                  }

                } 
                else {
                  result.push({
                    count: output[0].count,
                    removed: output[0].removed,
                    added: output[0].added,
                    value: `  ${key}: ${output[0].value},`,
                  });
                  result.push({
                    count: output[1].count,
                    removed: output[1].removed,
                    added: output[1].added,
                    value: `  ${key}: ${output[1].value},`,
                  });
                }

              }
            } else {

              if (!noise.includes(`${flattenKeyPath}.${key}`)) {
                result.push({ count: -1, removed: true, value: `  ${key}: ${JSON.stringify(valueExpectedObj, null, 2)},` });
                result.push({ count: -1, added: true, value: `  ${key}: ${JSON.stringify(valueActualObj, null, 2)},` });
              } else {
                var output = noiseDiffArray(valueExpectedObj, valueActualObj, "  " + key + ": ");
                output.map(function (el) {
                    result.push(el);
                });
              }
              
            }
          } else {
            result.push({ count: -1, removed: true, value: `  ${key}: ${JSON.stringify(expectedJSON[key], null, 2)},` });
          }
        }
        // keys not present in expectedJSON are of added type
        for (const key in actualJSON) {
          // if last element of result is of removed type than there should be gap between added otherwise it will be considered as modification.
          if( result[result.length-1].removed ){
            result.push({count: -3, value: ""})
          }
          if (!(key in expectedJSON)) {
            result.push({ count: -1, added: true, value: `  ${key}: ${JSON.stringify(actualJSON[key], null, 2)},` });
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
const computeLineInformation = (
  oldString: string,
  newString: string,
  noise: string[],
  disableWordDiff: boolean = false,
  compareMethod: string | ((oldStr: string, newStr: string) => diff.Change[]) = DiffMethod.CHARS,
  linesOffset: number = 0,
): ComputedLineInformation => {
  // let noiseTmp:string[] = []
  // for(let i=0; i<noise.length ;i++){
  // 	noiseTmp.push(noise[i])
  // }
  // let expectedStr =  addNoiseTags(oldString, "keploy.noise.l", noiseTmp, false)[0] as string
  // let actualStr = addNoiseTags(newString, "keploy.noise.r", noise, false)[0]  as string
  // console.log("exp and act")
  // console.log( expectedStr, actualStr)
  var diffArray: diff.Change[]
  var validJSON: string = "plain"
  if (noise === null || noise === undefined){
    noise = []
  }
  try{
    JSON.parse(oldString)
    JSON.parse(newString)
    // if (noise === null || noise === undefined){
    //   noise = []
    // }
    // diffArray = CompareJSON(
    //   oldString.trimRight(),
    //   newString.trimRight(),
    //   noise,
    //   "body",
    // )
    validJSON = "JSON"
  }
  catch(e){
    // if ( noise==null || noise.length==0 || (noise.length>0 && !noise.includes("body"))){
    //   diffArray = diff.diffLines(
    //     oldString.trimRight(),
    //     newString.trimRight(),
    //     {
    //       newlineIsToken: true,
    //       ignoreWhitespace: false,
    //       ignoreCase: false,
    //     },
    //   )
    //   if (diffArray.length ===1 ){
    //     diffArray[0].count = -1
    //   }
    // }
    // else{
    //   diffArray = noiseDiffArray(oldString, newString, "")
    // }
    
  }
  if (validJSON === 'plain'){
    if ( noise==null || noise.length==0 || (noise.length>0 && !noise.includes("body"))){
      diffArray = diff.diffLines(
        oldString.trimRight(),
        newString.trimRight(),
        {
          newlineIsToken: true,
          ignoreWhitespace: false,
          ignoreCase: false,
        },
      )
      if (diffArray.length === 1 ){
        diffArray[0].count = -1
      }
    }
    else{
      diffArray = noiseDiffArray(oldString, newString, "")
    }
  }
  else{
    diffArray = CompareJSON(
      oldString.trimRight(),
      newString.trimRight(),
      noise,
      "body",
    )
  }

  // const diffArray = CompareJSON(
	// 	 oldString.trimRight(),
	// 	 newString.trimRight(),
	// 	 noise,
	// 	 'body',
  //   // {
  //   // 	newlineIsToken: true,
  //   // 	ignoreWhitespace: false,
  //   // 	ignoreCase: false,
  //   // },
  // );
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
  // console.log(diffArray);
  // diffArray.forEach((element, elIndex) => {
  // 	if (element.value.includes("keploy.noise")){
  // 		element.added = undefined
  // 		element.removed = undefined
  // 	}
  // });
  // console.log(noise);
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
    LineIndexTobeReturned?: number,
  ): LineInformation[] => {
    // while (value.includes("keploy.noise")){
    // 	const stIgnore = value.indexOf("keploy.noise")
    // 	value = value.substring(0, stIgnore) + value.substring(stIgnore+14)
    // }
    const lines = constructLines(value);

    return lines
      .map(
        (line: string, lineIndex): LineInformation => {
          const left: DiffInformation = {};
          const right: DiffInformation = {};
          // if (evaluateOnlyFirstLine && lineIndex === 0 && added) {
          // 	let str = diffArray[diffIndex + 1].value, indexofNewLine=str.indexOf("\n");
          // 	if(indexofNewLine!==-1){
          // 		diffArray[diffIndex + 1].value = str.substring(indexofNewLine + 1)+"\nr";
          // 	}
          // 	else{
          // 		line = str
          // 	}
          // }
          if (
            ignoreDiffIndexes.includes(`${diffIndex}-${lineIndex}`)
						|| (evaluateOnlyFirstLine && lineIndex !== 0) || diffArray[diffIndex].count === -3
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
              // console.log(left.value)
              // When the current line is of type REMOVED, check the next item in
              // the diff array whether it is of type ADDED. If true, the current
              // diff will be marked as both REMOVED and ADDED. Meaning, the
              // current line is a modification.
              const nextDiff = diffArray[diffIndex + 1];
              if (nextDiff && nextDiff.added) {
                const nextDiffLines = constructLines(nextDiff.value)[lineIndex];
                if (lineIndex < constructLines(nextDiff.value).length && lineIndex === lines.length - 1) {
                  lines.push(' ');
                }
                // console.log()
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
                  )[lineIndex].right;
                  
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
            if (diffArray[diffIndex].count === -1 || diffArray[diffIndex].count >= 0) {
              leftLineNumber += 1;
              rightLineNumber += 1;
              left.lineNumber = leftLineNumber;
              left.type = DiffType.DEFAULT;
              right.lineNumber = rightLineNumber;
              right.type = DiffType.DEFAULT;
              left.value = line;
              right.value = line;
            } 
            else if(diffArray[diffIndex].count === -2) {
              const tagStartIndex = value.indexOf('_keploy_|_keploy_'); 
              const tagLength = '_keploy_|_keploy_'.length;
              // console.log('index of differentiator : ', tagStartIndex, ' length of differentiator : ', tagLength);
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
  // if (lineInformation.length === 1) {
  //   lineInformation.push({left: {value: "", lineNumber: 2, type:DiffType.DEFAULT}})
  // }
  return {
    lineInformation,
    diffLines,
  };
};

export { computeLineInformation };
