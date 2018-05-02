var express = require('express')
var app = express();
const fs = require("fs");
const md5 = require("md5");
const readline = require("readline");

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
  response.send('Hello World!')
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})

	
function main() {
	
    const anagramWithoutSpaces = "wild inovation suly".replace(/ /g, "");
    // The MD5 hash we want to find the phrases for.
    const hashes = [
        "87bb2bda651995d346c05b5049b4d78b"
    ];
    // Dictionary root node.
    const dictionary = {
        children: {},
        isWord: false
    };
    // Read the word list then begin finding the phrases.
    readWordList(
        "dictionary",
        word => addWordToDictionary(
            word,
            dictionary,
            () => dictFilter(word, anagramWithoutSpaces)
        ),
        () => findPhrases(dictionary, anagramWithoutSpaces, hashes, 0)
    );
}

/**
 * Read a dictionary from a file, streaming each line to a callback.
 * 
 * @param {string} path Path to the dictionary.
 * @param {Function} lineCallback Called for each line in file.
 * @param {Function} closeCallback Called when file has been read.
 */
function readWordList(path, lineCallback, closeCallback) {
    fs.exists(path, (exists) => {
        if (!exists) {
            console.error(`Couldn't find dictionary with path "${path}"`);
            return;
        }
        console.log("Reading words present in dictionary file...");
        const readStream = fs.createReadStream(path);
        const rl = readline.createInterface({
            input: readStream
        });
        if (lineCallback) {
            rl.on("line", lineCallback);
        }
        if (closeCallback) {
            rl.on("close", closeCallback);
        }
    });
}

/**
 * Add a word to the dictionary tree.
 * 
 * @param {string} word Word to add to the dictionary.
 * @param {Object} dict Dictionary tree to add the word to.
 * @param {Function} filter Filter function for words. Words will only get added if returns true.
 */
function addWordToDictionary(word, dict, filter) {
    word = word.toLowerCase();
    if (!filter || !filter(word)) {
        return;
    }
    let currentNode = dict;
    for (let i = 0; i < word.length; i++) {
        if (!currentNode.children.hasOwnProperty(word[i])) {
            currentNode.children[word[i]] = {
                children: {},
                isWord: false
            };
        }
        currentNode = currentNode.children[word[i]];
    }
    currentNode.isWord = true;
}

/**
 * Find secret phrases based on a dictionary tree.
 * Each valid phrase is tested against a list of hashes. 
 * 
 * @param {string} dict Dictionary tree to test use.
 * @param {string} anagram Anagram of the secret phrases.
 * @param {Array} hashes Hashes to test secret phrases against.
 * @param {number} spaces Number of spaces in the phrase.
 */
function findPhrases(dict, anagramWithoutSpaces, hashes, spaces) {
    console.log(`Finding secret phrases with ${spaces} spaces...`);
    const fn = (node, phrase, letters, curSpaces) => {
        // Check hash of the phrase if it's a valid phrase
        if (letters.length === 0) {
            if (node.isWord && curSpaces === spaces && hashes.indexOf(md5(phrase)) > -1) {
                console.log(`${md5(phrase)} : ${phrase}`);
            }
            return;
        }
        // Branch out through the dictionary tree.
        for (const key of Object.keys(node.children)) {
            const index = letters.indexOf(key);
            if (index === -1) {
                continue;
            }
            const newLetters = letters.slice(0, index) + letters.slice(index + 1);
            fn(node.children[key], phrase + key, newLetters, curSpaces);
        }
        if (node.isWord && curSpaces < spaces) {
            fn(dict, phrase + " ", letters, curSpaces + 1);
        }
    };
    fn(dict, "", anagramWithoutSpaces, 0);
    console.log(`Finished checking all phrases with ${spaces} spaces.`);
    findPhrases(dict, anagramWithoutSpaces, hashes, spaces + 1);
}

/**
 * Returns true if the word could be in the secret phrase.
 * 
 * @param {string} word Word to check.
 * @returns {boolean} Whether to use the word.
 */
function dictFilter(word, anagramWithoutSpaces) {
    // Filter null and empty strings;
    if (!word) {
        return false;
    }
    // Filter words longer than anagram.
    if (word.length > anagramWithoutSpaces.length) {
        return false;
    }
    // Will take each letter of the word and remove it from a list of remaining letters.
    // If a letter doesn't exist in the remaining letters, the word cannot be part of the anagram.
    let letters = anagramWithoutSpaces;
    for (let i = 0; i < word.length; i++) {
        const index = letters.indexOf(word[i]);
        if (index === -1) {
            return false;
        }
        letters = letters.slice(0, index) + letters.slice(index + 1);
    }
    return true;
}

main();