const { toInteger } = require('lodash');

const numbersMap = require('./numbers').numbersMap;

function convertFromFraction(value) {
    // number comes in, for example: 1 1/3
    if (value && value.trim().split(' ').length > 1) {
        const [whole, fraction] = value.split(' ');
        const [a, b] = fraction.split('/');
        const remainder = parseFloat(a) / parseFloat(b);
        const wholeAndFraction = parseInt(whole) ? parseInt(whole) + remainder : remainder;
        return keepThreeDecimals(wholeAndFraction);
    } else if (!value || value.split('-').length > 1) {
        return value;
    } else {
        const [a, b] = value.split('/');
        return b ? keepThreeDecimals(parseFloat(a) / parseFloat(b)) : a;
    }
}

function getFirstMatch(line, regex) {
    const match = line.match(regex);
    return (match && match[0]) || '';
}

const unicodeObj = {
    '½': '1/2',
    '⅓': '1/3',
    '⅔': '2/3',
    '¼': '1/4',
    '¾': '3/4',
    '⅕': '1/5',
    '⅖': '2/5',
    '⅗': '3/5',
    '⅘': '4/5',
    '⅙': '1/6',
    '⅚': '5/6',
    '⅐': '1/7',
    '⅛': '1/8',
    '⅜': '3/8',
    '⅝': '5/8',
    '⅞': '7/8',
    '⅑': '1/9',
    '⅒': '1/10'
};
function text2num(s, language) {
    const a = s.toString().trim().split(" ");
    let values = [0, 0];
    a.forEach(x => {
        values = feach(x, values[0], values[1], language)
    });
    if (values[0] + values[1] < 0)
        return null
    else
        return values[0] + values[1];
}

function feach(w, g, n, language) {
    let number = numbersMap.get(language)
    let small = number[0]
    let magnitude = number[1]
    var x = small[w];
    if (x != null) {
        g = g + x;
    }
    else if (100 == magnitude[w]) {
        if (g > 0)
            g = g * 100;
        else
            g = 100
    }
    else {
        x = magnitude[w];
        if (x != null) {
            n = n + g * x
            g = 0;
        }
        else
            return [-1, -1]

    }
    return [g, n]
}

function findQuantityAndConvertIfUnicode(ingredientLine, language) {
    const numericAndFractionRegex = /^(\d+\/\d+)|^(\d+\s\d+\/\d+)|^(\d+.\d+)|^(\d+\sand\s\d+\/\d+)/g;
    const numericAndFractionWithDashRegex = /^(\d+\-\d+\/\d+)/g;
    const numericMultiplierRegex = /^(\d+x\d+)/g;
    const numericRangeWithSpaceRegex = /^(\d+\-\d+)|^(\d+\s\-\s\d+)|^(\d+\sto\s\d+)/g; // for ex: "1 to 2" or "1 - 2"
    const numericAndFractionRangeWithSpaceRegex = /(\d\/\d\sto\s\d\/\d)/g;
    const unicodeFractionRegex = /\d*\s*[^\u0000-\u007F]+/g;
    const onlyUnicodeFraction = /[^\u0000-\u007F]+/g;
    const wordUntilSpace = /^\w+\s/g;

    for (let i in unicodeObj) ingredientLine = ingredientLine.replace(i, unicodeObj[i])

    // found a unicode quantity inside our regex, for ex: '⅝'
    if (ingredientLine.match(unicodeFractionRegex)) {
        const numericPart = getFirstMatch(ingredientLine, unicodeFractionRegex);
        const unicodePart = getFirstMatch(ingredientLine, numericPart ? onlyUnicodeFraction : unicodeFractionRegex).trim();

        // If there's a match for the unicodePart in our dictionary above
        if (unicodeObj[unicodePart]) {
            return [`${numericPart} ${unicodeObj[unicodePart]}`, ingredientLine.replace(getFirstMatch(ingredientLine, unicodeFractionRegex), '').trim()];
        }
    }

    // found a numeric multiplier quantity, for example: "2x300"
    if (ingredientLine.match(numericMultiplierRegex)) {
        let quantity = getFirstMatch(ingredientLine, numericMultiplierRegex);
        const numbers = quantity.split('x');
        quantity = toInteger(numbers[0]) * toInteger(numbers[1]);
        quantity = `${quantity}`;
        const restOfIngredient = ingredientLine.replace(getFirstMatch(ingredientLine, numericAndFractionRegex), '').trim()
        return [ingredientLine.match(numericAndFractionRegex) && quantity, restOfIngredient];
    }

    // found a numeric/fraction quantity, for example: "1-1/3"
    if (ingredientLine.match(numericAndFractionWithDashRegex)) {
        ingredientLine = ingredientLine.replace('-', ' ');
        const quantity = getFirstMatch(ingredientLine, numericAndFractionRegex);
        const restOfIngredient = ingredientLine.replace(getFirstMatch(ingredientLine, numericAndFractionRegex), '').trim()
        return [ingredientLine.match(numericAndFractionRegex) && quantity, restOfIngredient];
    }

    // found a numeric/fraction quantity, for example: "1 1/3"
    if (ingredientLine.match(numericAndFractionRegex)) {
        const quantity = getFirstMatch(ingredientLine.replace(/\sand\s/, ' '), numericAndFractionRegex);
        const restOfIngredient = ingredientLine.replace(getFirstMatch(ingredientLine, numericAndFractionRegex), '').trim()
        return [ingredientLine.match(numericAndFractionRegex) && quantity, restOfIngredient];
    }

    // found a quantity range, for ex: "2 to 3"
    if (ingredientLine.match(numericRangeWithSpaceRegex)) {
        const quantity = getFirstMatch(ingredientLine, numericRangeWithSpaceRegex).replace('to', '-').split(' ').join('');
        const restOfIngredient = ingredientLine.replace(getFirstMatch(ingredientLine, numericRangeWithSpaceRegex), '').trim();
        return [ingredientLine.match(numericRangeWithSpaceRegex) && quantity, restOfIngredient];
    }

    // found a quantity range with fraction, for ex: "1/2 to 1/3"
    if (ingredientLine.match(numericAndFractionRangeWithSpaceRegex)) {
        const quantity = getFirstMatch(ingredientLine, numericAndFractionRangeWithSpaceRegex).replace('to', '-').split(' ').join('');
        const restOfIngredient = ingredientLine.replace(getFirstMatch(ingredientLine, numericAndFractionRangeWithSpaceRegex), '').trim();
        return [ingredientLine.match(numericAndFractionRangeWithSpaceRegex) && quantity, restOfIngredient];
    }
    
    if (ingredientLine.match(wordUntilSpace)) {
        const quantity = getFirstMatch(ingredientLine, wordUntilSpace);
        let quantityNumber = text2num(quantity.toLowerCase(), language);
        quantityNumber = quantityNumber ? quantityNumber : toInteger(quantity);
        if (quantityNumber) {
            const restOfIngredient = ingredientLine.replace(getFirstMatch(ingredientLine, wordUntilSpace), '').trim()
            return [ingredientLine.match(wordUntilSpace) && quantityNumber + '', restOfIngredient];
        }
        else
            return [null, ingredientLine];
    }

    // no parse-able quantity found
    else {
        return [null, ingredientLine];
    }
}

function keepThreeDecimals(val) {
    const strVal = val.toString();
    return strVal.split('.')[0] + '.' + strVal.split('.')[1].substring(0, 3);
}


module.exports = {
    convertFromFraction,
    getFirstMatch,
    text2num,
    feach,
    findQuantityAndConvertIfUnicode
}