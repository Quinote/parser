/* QuiNote Software Group 2015
Author: Elliott Warkus

Contains methods for generating quizzes from a ParseResult object.

Access is via calls to makeQuiz(parseResult, optionList), and returns 
a Quiz object containing a number of questions.


TODO:

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
	this.questions = questions;
}

////////////////////////

function OptionList() {
	// specifies the settings for quiz generation
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
	var generatedQuestions = [];
	var numberOfQuestions = Math.min(parseResult.parsedElements.length, optionList.numberOfQuestions);
	
	var identifierPool = parseResult.getIdentifiers();
	
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
	if (identifierPool.length === 0) {
		console.log("Error: out of keys from which to generate questions");
		return null;
	} else {
		 key = identifierPool.splice(index, 1)[0];
		 if (key instanceof DateElement) {
			 key = key.date;
		 } else if (key instanceof IdentifierElement) {
			 key = key.identifier;
		 }
		 console.log(key);
	}
	
	var parseElement = parseResult.getElementByKey(key);
	
	// select one correct answer from possible definitions
	
	var definitionIndex = Math.floor(Math.random()*parseElement.definitions.length);
	var correctAnswer = parseElement.definitions[definitionIndex];
	
	
	// select three incorrect answers from other possible definitions
	var otherChoices = [];
	if (parseElement instanceof DateElement) {
		var eventPool = parseResult.events.slice();
		console.log(eventPool);
		// ensure no answer overlap
		removeAll(eventPool, parseElement.definitions);
		
		while (otherChoices.length < 3) {
			if (eventPool.length === 0) {
				console.log("Insufficient input to produce date question.");
				return null;
			}
			var eventIndex = Math.floor(Math.random()*eventPool.length);
			var event = eventPool.splice(eventIndex, 1)[0];
			
			otherChoices.push(event);
			
			
		}
	} else if (parseElement instanceof IdentifierElement) {
		var definitionPool = parseResult.definitions.slice();
		console.log(definitionPool);
		// ensure no answer overlap
		removeAll(definitionPool, parseElement.definitions);
		
		while (otherChoices.length < 3) {
			if (definitionPool.length === 0) {
				console.log("Insufficient input to produce identifier question.");
				return null;
			}
			
			var definitionIndex = Math.floor(Math.random()*definitionPool.length);
			var definition = definitionPool.splice(definitionIndex, 1)[0];
			
			otherChoices.push(definition);
		}
	}
	
	return new MultipleChoiceQuestion(key, correctAnswer, otherChoices);
}

function removeAll(targetArray, elementsToRemove) {
	for (i in elementsToRemove) {
		var index = $.inArray(elementsToRemove[i], targetArray);
		while (index > -1) {
			targetArray.splice(index, 1);
			index = $.inArray(elementsToRemove[i], targetArray);
		}
	}
}
	
	



















