/* QuiNote Software Group 2015
Author: Elliott Warkus

Contains methods for parsing textual input.

Access is via calls to parseInput(elements), where elements is an array 
of newline-separated strings, and returns a ParseResult object, which consists
of arrays of (possibly nested) objects. 

TODO: 
	- better dateRegex
	- create an emptyRegex to identify whitespace
	- where is preformatting / API-dependent separation of elements done?

*/

//**************************************
// GLOBAL VARIABLES
//**************************************

var dateRegex = /[0-9]+-[0-9]+-[0-9]+/;
var ideaRegex = /([^:])+/;
var equalityRegex = /:|-/;
var separatorRegex = /;/;

// these need to be global because of recursive scoping issues
// alternative would be recursive construction of a ParseResult
var parsedElements = [];
var identifiers = [];
var dates = [];
var definitions = [];
var events = [];
var other = [];

//**************************************
// PROTOTYPE OBJECTS
//**************************************

////////////////////////
// Main return object //
////////////////////////

function ParseResult(parsedElements, identifiers, dates, definitions, events, other) {
	this.parsedElements = parsedElements;
	this.identifiers = identifiers;
	this.dates = dates;
	this.definitions = definitions;
	this.events = events;
	this.other = other;
	
	this.getIdentifiers = function () {
		var identifierPool = [];
		for (i in this.identifiers) {
			identifierPool.push(this.identifiers[i]);
		}
		for (i in this.dates) {
			identifierPool.push(this.dates[i]);
		}
		return identifierPool;
	}
	
	this.getElementByKey = function (key) {
		// TODO: function description
		for (i in this.parsedElements) {
			var element = this.parsedElements[i];
			if (element instanceof DateElement) {
				if (element.date === key) {
					return element;
				}
			} else if (element instanceof IdentifierElement) {
				if (element.identifier === key) {
					return element;
				}
			}
		}
	}
}

////////////////////////

function RawElement(value) {
	/* A RawElement is an unparsed line. The structure of a 
		RawElement reflects only indentation level organization
	*/
	this.value = value; // Identifier and possibly definition
	this.subelements = [];
}

function IdentifierElement (identifier) {
	/* An IdentifierElement contains, at the bare minimum,
		an identifier. It may also contain a DefinitionElement 
		(making it a definition type) and any number of nested
		subelements (making it a list).
	
	*/
	this.identifier = identifier;
	this.definitions = []; // to be set if applicable
	this.subelements = []; // to be appended to if applicable
}

function DateElement (date) {
	/* Like an IdentifierElement, a DateElement contains at
		least a date and possibly a definition and/or list.
	*/
	this.date = date;
	this.definitions = [];
	this.subelements = [];
}

//*************************************
//FUNCTIONS
//*************************************

/////////////////////////
//  Main access method //
/////////////////////////

function parseInput(elements) {
	/* Given a list of elements, first assign hierarchy based on indent
	levels then parse according to parse rules. Returns a ParseResult
	object containing the results of the final parsing function
	*/
	// clear global arrays
	parsedElements = [];
	identifiers = [];
	dates = [];
	definitions = [];
	events = [];
	other = [];
	
	// get list of top-level elements containing their subelements
	var rawElements = readIndentLevels(elements, 0, 0);
	
	for (var i=0; i<rawElements.length; i++) {
		// ignore empty lines
		if (rawElements[i].value.length === 0) continue;
		
		// parse indent-organized RawElements
		var parsedElement = parseRawElement(rawElements[i]);

		parsedElements.push(parsedElement);
	}
	
	return new ParseResult(parsedElements, identifiers, dates, definitions, events, other);
}

/////////////////////////

function readIndentLevels (elements, index, indentationLevel) {
	/* given line-by-line input array elements, 
		recursively parse those lines (in-order)
		and their subelements
	*/
	var indentLevelElements = [];
	
	while (index < elements.length) {
		
		// format of element depends on surrounding API TODO
		var val = elements[index];
		
		// get indentation level of current element
		var currentIndentation = getIndentationLevel(val); 
		
		if (currentIndentation < indentationLevel) return indentLevelElements;
		
		var currentElement = new RawElement(val);
		indentLevelElements.push(currentElement);
		index++;
		
		// if has subelements, recurse on them
		if (index < elements.length) {
			var nextIndentation = getIndentationLevel(elements[index]);
			
			if (nextIndentation < indentationLevel) {
				break;
			} else if (nextIndentation === indentationLevel) {
				continue;
			} else {
				currentElement.subelements = 
					readIndentLevels(elements, index, nextIndentation);
				index += countSubelements(currentElement);
			}
		}
	}
	return indentLevelElements;
}

function countSubelements(rawElement) {
	// recursively determine the number of subelements in a parent Element's tree			
	var count = rawElement.subelements.length;
	for (var i=0; i<rawElement.subelements.length; i++) {
		count += countSubelements(rawElement.subelements[i]);
	}
	return count;
}

function parseRawElement(rawElement) {
	/* recursively turn RawElements into their respective 
	IdentifierElement or DateElement forms
	*/
	var newElement;
	
	var components = rawElement.value.split(":");
	
	if (dateRegex.test(components[0]) ) {
		newElement = new DateElement(components[0]);
		if (components.length > 1) {
			dates.push(newElement);
		}
	} else if (ideaRegex.test(components[0]) ) {
		newElement = new IdentifierElement(components[0]);
		if (components.length > 1) {
			identifiers.push(newElement);
		}
	}
	
	if (components.length === 2) {
		var definition = components[1];
		newElement.definitions.push(definition);
		if (newElement instanceof DateElement) {
			events.push(definition);
		} else if (newElement instanceof IdentifierElement) {
			definitions.push(definition);
		}
	} else {
		other.push(newElement);
	}
	
	for (var i=0; i<rawElement.subelements.length; i++) {
		newElement.subelements.push(parseRawElement(rawElement.subelements[i]));
	}

	return newElement;
}

function getIndentationLevel(str) {
	// count the indentation level of the given string
	
	var count = 0;
	
	//needs to be adjusted for leading tabs, not all tabs
	while (/\t/.test(str)) {
		str = str.replace("\t", "");
		count++;
	}
	return count;
}