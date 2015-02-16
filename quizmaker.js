/* QuiNote Software Group 2015
Author: Elliott Warkus

Contains methods for generating quizzes from a ParseResult object.

Access is via calls to makeQuiz(parseResult, optionList), and returns 
a Quiz object containing a number of questions.


TODO:
	- Avoid infinite loop based on insufficient input size

*/

//**************************************
// GLOBAL VARIABLES
//**************************************



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
	this.numberOfQuestions = 2;
	
	this.questionTypes = {
		"Multiple Choice": 10, 
		"Fill-in-the-blank": 0, 
		"True or False": 0 
	};
}

function MultipleChoiceQuestion(identifier, answer, otherChoices) {
	this.identifier = identifier;
	this.answer = answer;
	this.otherChoices = otherChoices;
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
	
	for (var i = 0; i<numberOfQuestions; i++) {
		var newQuestion;
		
		// call makeMultipleChoiceQuestion until non-null result is found
		while ((newQuestion = makeMultipleChoiceQuestion(
				identifierPool, parseResult)) === null);
		
		generatedQuestions.push(newQuestion);
	}
	
	return new Quiz(generatedQuestions);
}

/////////////////////////

function makeMultipleChoiceQuestion(identifierPool, parseResult) {
	// select random Identifier
	var index = Math.floor(Math.random()*identifierPool.length);
	
	// remove and return one key
	var key;
	while (typeof key === "undefined") {
		if (identifierPool.length === 0) {
			console.log("Error: out of keys from which to generate questions");
			return null;
		} else {
			 key = identifierPool.splice(index, 1)[0];
			 
			 // continue if element has no definition
			 if (key.definitions.length === 0) continue;
			 
			 if (key instanceof DateElement) {
				 key = key.date;
			 } else if (key instanceof IdentifierElement) {
				 key = key.identifier;
			 }
		}
	}
	
	// get element associated with key
	var parseElement = parseResult.getElementByKey(key);
	console.log(parseElement, key);
	// select one correct answer from possible definitions
	var definitionIndex = Math.floor(Math.random()*parseElement.definitions.length);
	var correctAnswer = parseElement.definitions[definitionIndex];
	
	// select three incorrect answers from other possible definitions
	var otherChoices = [];
	if (parseElement instanceof DateElement) {
		var eventPool = parseResult.events.slice();
		// ensure no answer overlap
		removeAll(eventPool, parseElement.definitions);
		
		while (otherChoices.length < 3) {
			if (eventPool.length === 0) {
				console.log("Insufficient input to produce date question.");
				return null;
			}
			// select random wrong answer
			var eventIndex = Math.floor(Math.random()*eventPool.length);
			var event = eventPool.splice(eventIndex, 1)[0];
			
			otherChoices.push(event);
		}
	} else if (parseElement instanceof IdentifierElement) {
		var definitionPool = parseResult.definitions.slice();
		// ensure no answer overlap
		removeAll(definitionPool, parseElement.definitions);
		
		while (otherChoices.length < 3) {
			if (definitionPool.length === 0) {
				console.log("Insufficient input to produce identifier question.");
				return null;
			}
			// select random wrong answer
			var definitionIndex = Math.floor(Math.random()*definitionPool.length);
			var definition = definitionPool.splice(definitionIndex, 1)[0];
			
			otherChoices.push(definition);
		}
	}
	
	return new MultipleChoiceQuestion(key, correctAnswer, otherChoices);
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
	
	



















