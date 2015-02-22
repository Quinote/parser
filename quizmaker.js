/* QuiNote Software Group 2015
Author: Elliott Warkus

Contains methods for generating quizzes from a ParseResult object.

Access is via calls to makeQuiz(parseResult, optionList), and returns 
a Quiz object containing a number of questions.


TODO:
	- Likely a lot of bug-fixing
	- Avoid infinite loop based on insufficient input size
	- when receiving null results, readd elements to pool?

*/

//**************************************
// GLOBAL VARIABLES
//**************************************

/* List of words not to remove from fill-in-the-blank questions
	[Under development]

   Includes:
	- articles
	- some prepositions
	- conjunctions
	- common conjugated verbs
*/
var FITB_filter = [
	"the", "a", "an",
	"to", "of",
	"and", "but", "or", "yet",
	"is", "are", "was", "were", "be"
];

//**************************************
// PROTOTYPE OBJECTS
//**************************************

////////////////////////
// Main return object //
////////////////////////

function Quiz(questions) {
	// currently only contains a list of questions
	
	this.questions = questions;
}

////////////////////////

function OptionList() {
	// specifies the settings for quiz generation
	
	// limited for testing purposes
	this.numberOfQuestions = 11;
	
	this.questionTypes = {
		"Multiple choice": 4, 
		"Fill-in-the-blank": 4, 
		"True or false": 3
	};
}

function MultipleChoiceQuestion(identifier, answer, otherChoices) {
	this.identifier = identifier;
	this.answer = answer;
	this.otherChoices = otherChoices;
	
	this.getText = function() {
		return "Which of the following is associated with \"" + this.identifier + "\"?";
	}
}

function TrueFalseQuestion(identifier, definition, answer) {
	this.identifier = identifier;
	this.definition = definition;
	this.answer = answer;
	
	this.getText = function() {
		return "True or false: \"" + this.identifier + "\" is associated with \"" + this.definition + "\"";
	}
	
	this.text = "\"" + this.identifier + "\" is associated with " + "\"" + this.definition + "\"";
}

function FillInTheBlankQuestion(definitionString, startIndex, stopIndex, answer) {
	this.definitionString = definitionString;
	this.answer = answer;
	
	// unsure if these are needed
	this.startIndex = startIndex; 
	this.stopIndex = stopIndex;
	
	
	// TODO: metadata for location in notes
	
	this.getText = function() {
		return "Fill in the blank: \"" + this.definitionString + "\"";
	}
}
	

//**************************************
// FUNCTIONS
//**************************************

/////////////////////////
//  Main access method //
/////////////////////////

function makeQuiz(parseResult, optionList) {
	if (typeof optionList === "undefined") {
		optionList = new OptionList();
	}
	
	var generatedQuestions = [];
	var numberOfQuestions = Math.min(parseResult.parsedElements.length, optionList.numberOfQuestions);
	
	var identifierPool = parseResult.getIdentifiers();
	
	if (identifierPool.length < numberOfQuestions) {
		console.log("Error: not enough identifiers found to make " + numberOfQuestions + " questions");
	}
	
	for (var i = 0; i<optionList.questionTypes["Multiple choice"]; i++) {
		var newQuestion = undefined;
		
		// call makeMultipleChoiceQuestion until non-null result is found
		while (typeof newQuestion === "undefined") {
			// abort if identifierPool becomes empty
			if (identifierPool.length === 0) {
				console.log("Maximum questions fewer than requested");
				return new Quiz(generatedQuestions);
			}
			
			// set value of newQuestion
			newQuestion = makeMultipleChoiceQuestion(identifierPool, parseResult);
		}
		generatedQuestions.push(newQuestion);
	}
	for (var i = 0; i<optionList.questionTypes["Fill-in-the-blank"]; i++) {
		var newQuestion = undefined;
		
		// call makeMultipleChoiceQuestion until non-null result is found
		while (typeof newQuestion === "undefined") {
			// abort if identifierPool becomes empty
			if (identifierPool.length === 0) {
				console.log("Maximum questions fewer than requested");
				return new Quiz(generatedQuestions);
			}
			
			// set value of newQuestion
			newQuestion = makeFillInTheBlankQuestion(identifierPool, parseResult);
		}
		
		generatedQuestions.push(newQuestion);
	}
	for (var i = 0; i<optionList.questionTypes["True or false"]; i++) {
		var newQuestion = undefined;
		
		// call makeMultipleChoiceQuestion until non-null result is found
		while (typeof newQuestion === "undefined") {
			// abort if identifierPool becomes empty
			if (identifierPool.length === 0) {
				console.log("Maximum questions fewer than requested");
				return new Quiz(generatedQuestions);
			}
			
			// set value of newQuestion
			newQuestion = makeTrueFalseQuestion(identifierPool, parseResult);
		}
		
		generatedQuestions.push(newQuestion);
	}
	
	return new Quiz(generatedQuestions);
}

/////////////////////////

function makeMultipleChoiceQuestion(identifierPool, parseResult) {
	var element, identifier, correctAnswer, otherChoices;
	
	// remove one key or return if none remain
	if (identifierPool.length === 0) {
		console.log("Error: out of keys from which to generate questions");
		return undefined;
	} else {
		// select random element
		element = removeRandomElement(identifierPool);
		identifier = element.getIdentifier();
	}

	// select one correct answer from possible definitions
	correctAnswer = randomElement(element.definitions);
	
	// select three incorrect answers from other possible definitions
	otherChoices = [];
	if (element instanceof DateElement) {
		// copy events to new array
		var eventPool = parseResult.events.slice();
		// ensure no answer overlap
		removeAll(eventPool, element.definitions);
		
		for (var i=0; i<3; i++) {
			console.log(eventPool.length);
			if (eventPool.length === 0) {
				console.log("Insufficient input to produce date question.");
				return undefined;
			}
			// select and remove random wrong answer (to avoid repeats)
			var event = removeRandomElement(eventPool);
			
			otherChoices.push(event);
		}
	} else if (element instanceof IdentifierElement) {
		// copy definitions to new array
		var definitionPool = parseResult.definitions.slice();
		// ensure no answer overlap
		removeAll(definitionPool, element.definitions);
		
		for (var i=0; i<3; i++) {
			if (definitionPool.length === 0) {
				console.log("Insufficient input to produce identifier question.");
				return undefined;
			}
			// select random wrong answer
			var definition = removeRandomElement(definitionPool);
			
			otherChoices.push(definition);
		}
	}
	
	return new MultipleChoiceQuestion(identifier, correctAnswer, otherChoices);
}

function makeTrueFalseQuestion(identifierPool, parseResult) {
	var identifier, definition, answer;
	
	// select base element
	var element = removeRandomElement(identifierPool);
	identifier = element.getIdentifier();
	
	// choose whether to do true or false
	var isTrue = true;
	if (Math.random() > .5) isTrue = false;
	
	if (isTrue) {
		answer = true;
		
		// get random correct answer
		definition = randomElement(element.definitions);
	} else {
		answer = false;
		
		// this is extra-naive: get a random incorrect answer from
		// pool of all definitions
		var definitionPool;
		if (element instanceof DateElement) {
			definitionPool = parseResult.events.slice();
		} else if (element instanceof IdentifierElement) {
			definitionPool = parseResult.definitions.slice();
		}
		removeAll(definitionPool, element.definitions);
		definition = randomElement(definitionPool);
	}
	
	return new TrueFalseQuestion(identifier, definition, answer);
}

function makeFillInTheBlankQuestion(identifierPool, parseResult) {
	// basic, naive fill-in-the-blank question generator
	
	var definitionString, startIndex, stopIndex, answer;
	
	// select base element
	var element = removeRandomElement(identifierPool);
	// select one of its definitions
	var definition = randomElement(element.definitions);
	
	var definitionString = element.getIdentifier() + ": " + definition;
	
	// remove one legal word from the definitionString
	var wordlist = definitionString.split(" ");
	startIndex = -1;
	while (startIndex === -1) {
		if (wordlist.length === 0) {
			console.log("Error: this element cannot be made into a FITB question");
			return null;
		}
		answer = removeRandomElement(wordlist);
		if (answer.substring(answer.length-1) === ":") {
			answer = answer.substring(0, answer.length-1);
		}
		//test to see if removed word is in prohibited list
		if ($.inArray(answer, FITB_filter) === -1) {
			startIndex = definitionString.indexOf(answer);
		}
	}
	
	stopIndex = startIndex + answer.length;
	
	var blankString = "";
	for (var i=0; i<answer.length; i++) {
		blankString += "_";
	}
	
	definitionString = definitionString.substring(0, startIndex) 
		+ blankString + definitionString.substring(stopIndex);
	
	return new FillInTheBlankQuestion(definitionString, startIndex, stopIndex, answer);
}

function removeAll(targetArray, elementsToRemove) {
	// remove all elements in elementsToRemove from targetArray
	for (i in elementsToRemove) {
		var index = $.inArray(elementsToRemove[i], targetArray);
		while (index > -1) {
			targetArray.splice(index, 1);
			index = $.inArray(elementsToRemove[i], targetArray);
		}
	}
}

function randomIndex(array) {
	// get random legal index into array
	// returns 0 if array is empty
	var index =  Math.floor(Math.random()*array.length);
	return index;
}

function randomElement(array) {
	// get random element of array
	if (array.length === 0) {
		console.log("Error: array is empty.");
		return null;
	}
	return array[randomIndex(array)];
}

function removeRandomElement(array) {
	// remove and return a random element from array
	if (array.length === 0) {
		console.log("Error: array is empty.");
		return null;
	}
	return array.splice(randomIndex(array), 1)[0];
}



















