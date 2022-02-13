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
	if (value===undefined){
		return []
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

function jsonParse(val: string): any{
	try{
	  JSON.parse(val)
	} catch(e){
	  return val
	}
	return JSON.parse(val)
  }
  
  function addNoiseTags(
	targetStr:string, 
	tag:string,
	noise: string[],
	noisyField: boolean): [any]{
	let type
	if (targetStr!==""){
	  type = typeof JSON.parse(targetStr)
	}
	// console.log("line 24",targetStr, noise[0], noise[1],noisyField)
	switch(type){
	  case "string": {
		if (noisyField){
		  targetStr = tag+ JSON.parse(targetStr)
		//   console.log(targetStr)
		}
		break;
	  }
	  case "number": {
		  if (noisyField){
			targetStr = tag+ JSON.parse(targetStr) as string
			// console.log(targetStr)
		  }
		  break;
		}
	  case "boolean": {
		  if (noisyField){
			targetStr = tag+JSON.parse(targetStr) as string
			// console.log(targetStr)
		  }
		  break;
		}
	  case "object": {
		var oldVal = JSON.parse(targetStr)
		if (oldVal===null){
		//   console.log("&&&")
		  if (noisyField){
			targetStr = tag+"null"
			let type
			if (targetStr!==""){
			  type = typeof JSON.parse(targetStr)
			}          
			console.log("*line 142",targetStr)
		  }
		  return [targetStr]
		}
		if (Array.isArray(oldVal)){
		  // if (noisyField){
		  //   targetStr = "keploy.noise.l"+targetStr
		  //   newCod = "keploy.noise.r"+newCod
		  //   break;
		  // }
		  oldVal = oldVal.map((el, elIndex)=>{
			el =  jsonParse(addNoiseTags(JSON.stringify(el), /*JSON.stringify(el),*/ tag, noise, noisyField)[0] )
			// console.log("j",el)
			return el
		  })
		//   console.log("***\n", oldVal)
		return [JSON.stringify(oldVal)]
		}
		else{
		  if (noisyField){
			for (let k in oldVal){
			  oldVal[k] = jsonParse( addNoiseTags(JSON.stringify(oldVal[k]), tag/*, JSON.stringify(oldVal[k])*/, noise, true)[0] )
			}
		  }
		  if (noise!=undefined && Array.isArray(noise)){
  
			Array.from( noise).forEach((el, elIndx) => {
			  if(el!=undefined){
  
				let dotIndx = el.indexOf(".")
				if(dotIndx === -1){
				  let key = el.substring(0)
				//   console.log("line 70",key)
				  let noiseTmp:string[] = []
				  for(let i=0; i<noise.length ;i++){
					if (noise[i]!=undefined){
					  noiseTmp.push(noise[i].substring( noise[i].includes(".")? noise[i].indexOf(".")+1:-1))
					}
					else{
					  noiseTmp.push(noise[i])
					}
				  } 
				  delete noiseTmp[elIndx]
				  if (typeof oldVal==="object" && oldVal!=null && key in oldVal){
					let repOld =  addNoiseTags(JSON.stringify(oldVal[key]), tag, /*JSON.stringify(oldVal[key]),*/ noiseTmp, true)
					// console.log("line 79", repOld, JSON.parse( JSON.stringify(repOld[0])), oldVal[key])
					oldVal[key] = jsonParse(repOld[0])
				  } 
				}
				else {
				  let noiseTmp:string[] = []
				  for(let i=0; i<noise.length ;i++){
					if (noise[i]!=undefined){
					  noiseTmp.push(noise[i].substring( noise[i].includes(".")? noise[i].indexOf(".")+1:-1))
					}
					else{
					  noiseTmp.push(noise[i])
					}
				  } 
				  noiseTmp[elIndx] = el.substring(dotIndx+1)
				  var key = el.substring(0, dotIndx)
				//   console.log("line 86",key)
				  if (oldVal!=null && key in oldVal){
					// console.log("bug 89")
					oldVal[key] = jsonParse( addNoiseTags(JSON.stringify(oldVal[key]), tag, /*JSON.stringify(oldVal[key]),*/ noiseTmp, noisyField)[0] )
				  } 
				}
			  }
			})
		  }
		  return [JSON.stringify(oldVal, null, 2)/*,JSON.stringify(newVal)*/]
		}
		// break;
	  }
	  default: {
		if (noisyField){
		  targetStr = tag+ JSON.parse(targetStr) as string
		//   console.log("*line 142",targetStr/*, newCod*/)
		}
		break;
	  }
  
	}
	return [targetStr]
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
	let noiseTmp:string[] = []
	for(let i=0; i<noise.length ;i++){
		noiseTmp.push(noise[i])
	}
	let expected =  addNoiseTags(oldString, "keploy.noise.l", noiseTmp, false)[0] as string
	let actual = addNoiseTags(newString, "keploy.noise.r", noise, false)[0]  as string
	console.log("exp and act")
	console.log( expected, actual)
	const diffArray = diff.diffLines(
		 expected.trimRight() ,
		 actual.trimRight() ,
		{
			newlineIsToken: true,
			ignoreWhitespace: false,
			ignoreCase: false,
		},
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
	console.log(diffArray)
	diffArray.forEach((element, elIndex) => {
		if (element.value.includes("keploy.noise")){
			element.added = undefined
			element.removed = undefined
		}
	});
	console.log(noise)
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
		while (value.includes("keploy.noise")){
			const stIgnore = value.indexOf("keploy.noise")
			value = value.substring(0, stIgnore) + value.substring(stIgnore+14)
		}
		const lines = constructLines(value);

		return lines
			.map(
				(line: string, lineIndex): LineInformation => {
					const left: DiffInformation = {};
					const right: DiffInformation = {};
					// if (
					// 	ignoreDiffIndexes.includes(`${diffIndex}-${lineIndex}`) ||
					// 	(evaluateOnlyFirstLine && lineIndex !== 0)
					// ) {
					// 	return undefined;
					// }
					// if (added || removed) {
					// 	if (!diffLines.includes(counter)) {
					// 		diffLines.push(counter);
					// 	}
					// 	if (removed) {
					// 		leftLineNumber += 1;
					// 		left.lineNumber = leftLineNumber;
					// 		left.type = DiffType.REMOVED;
					// 		left.value = line || ' ';
					// 		// When the current line is of type REMOVED, check the next item in
					// 		// the diff array whether it is of type ADDED. If true, the current
					// 		// diff will be marked as both REMOVED and ADDED. Meaning, the
					// 		// current line is a modification.
					// 		const nextDiff = diffArray[diffIndex + 1];
					// 		if (nextDiff && nextDiff.added) {
					// 			const nextDiffLines = constructLines(nextDiff.value)[lineIndex];
					// 			if (nextDiffLines) {
					// 				const {
					// 					value: rightValue,
					// 					lineNumber,
					// 					type,
					// 				} = getLineInformation(
					// 					nextDiff.value,
					// 					diffIndex,
					// 					true,
					// 					false,
					// 					true,
					// 				)[0].right;
					// 				// When identified as modification, push the next diff to ignore
					// 				// list as the next value will be added in this line computation as
					// 				// right and left values.
					// 				ignoreDiffIndexes.push(`${diffIndex + 1}-${lineIndex}`);
					// 				right.lineNumber = lineNumber;
					// 				right.type = type;
					// 				// Do word level diff and assign the corresponding values to the
					// 				// left and right diff information object.
					// 				if (disableWordDiff) {
					// 					right.value = rightValue;
					// 				} else {
					// 					const computedDiff = computeDiff(
					// 						line,
					// 						rightValue as string,
					// 						compareMethod,
					// 					);
					// 					right.value = computedDiff.right;
					// 					left.value = computedDiff.left;
					// 				}
					// 			}
					// 		}
					// 	} else {
					// 		rightLineNumber += 1;
					// 		right.lineNumber = rightLineNumber;
					// 		right.type = DiffType.ADDED;
					// 		right.value = line;
					// 	}
					// } else {
						
					// 	if (diffArray[diffIndex].value.includes("keploy.noise.l")){
					// 		leftLineNumber += 1;
					// 		rightLineNumber += 1;
					// 		left.lineNumber = leftLineNumber;
					// 		left.type = DiffType.DEFAULT;
					// 		right.lineNumber = rightLineNumber;
					// 		right.type = DiffType.DEFAULT;
					// 		left.value = line;
					// 		var rightValue
					// 		if (diffArray[diffIndex+1].value.includes("keploy.noise")){
					// 			const stIgnore = diffArray[diffIndex+1].value.indexOf("keploy.noise")
					// 			rightValue = diffArray[diffIndex+1].value.substring(0, stIgnore) + diffArray[diffIndex+1].value.substring(stIgnore+14)
					// 			diffArray[diffIndex+1].value = "keploy.noise"
					// 			console.log(diffArray[diffIndex+1].value)
					// 		}
					// 		// console.log("***", rightValue, diffArray[diffIndex+1].value, "***")
					// 		const rightLineToBeIgnored = constructLines(rightValue);
					// 		if (lineIndex <= rightLineToBeIgnored.length){
					// 			right.value = rightLineToBeIgnored[lineIndex]
					// 			if (lineIndex === lines.length-1){
					// 				for(var i=lineIndex+1; i<rightLineToBeIgnored.length ;i++){
					// 					lines.push(" ")
					// 				}
					// 			}
					// 		} 
					// 	} 
					// 	else if(!diffArray[diffIndex].value.includes("keploy.noise")) {
					// 		leftLineNumber += 1;
					// 		rightLineNumber += 1;
					// 		left.lineNumber = leftLineNumber;
					// 		left.type = DiffType.DEFAULT;
					// 		right.lineNumber = rightLineNumber;
					// 		right.type = DiffType.DEFAULT;
					// 		left.value = line;
					// 		right.value = line;
					// 	}
					// 	else if(diffArray[diffIndex].value.includes("keploy.noise.r")){
					// 		leftLineNumber += 1;
					// 		rightLineNumber += 1;
					// 		left.lineNumber = leftLineNumber;
					// 		left.type = DiffType.DEFAULT;
					// 		right.lineNumber = rightLineNumber;
					// 		right.type = DiffType.DEFAULT;
					// 		right.value = line
					// 		left.value = ""
					// 	}
					// }

					leftLineNumber += 1;
					rightLineNumber += 1;
					left.lineNumber = leftLineNumber
					right.lineNumber = rightLineNumber
					left.type = DiffType.DEFAULT
					right.type = DiffType.DEFAULT
					left.value = "  vas"
					right.value = "  vas"
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
