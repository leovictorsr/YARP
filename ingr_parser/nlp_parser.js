const convert = require('./convert');
const { unitsMap, methods } = require('./units');
const { repeatingFractions } = require('./repeatingFractions')

function getUnit(input, language) {
  // const word = input.concat(' ').concat(secondWord)
  let unit = unitsMap.get(language)
  let units = unit[0];
  let response = [];
  if (units[input]) {
    response = input;
  }
  for (const unit of Object.keys(units)) {
    for (const shorthand of units[unit]) {
      const regex = new RegExp('\\b' + shorthand + '\\b\\s*', 'gi')
      if (input.match(regex)) {
        response.push(unit);
        response.push(shorthand);
        break;
      }
    }
  }

  return response
}

/* return the proposition if it's used before of the name of
the ingredient */
function getPreposition(input, language) {
  let prepositionMap = unitsMap.get(language)
  let prepositions = prepositionMap[1];
  for (const preposition of prepositions) {
    let regex = new RegExp('^' + preposition)
    if (convert.getFirstMatch(input, regex))
      return preposition;

  }

  return null;
}

function parse(recipeString, language) {
  try {
    const ingredientLine = recipeString.trim(); // removes leading and trailing whitespace
  
    /* restOfIngredient represents rest of ingredient line.
    For example: "1 pinch salt" --> quantity: 1, restOfIngredient: pinch salt */
    let [quantity, restOfIngredient] = convert.findQuantityAndConvertIfUnicode(ingredientLine, language);
  
    quantity = quantity ? quantity : '1';
    let minQty = quantity; // default to quantity
    let maxQty = quantity; // default to quantity
  
    // if quantity is non-nil and is a range, for ex: "1-2", we want to get minQty and maxQty
    if (quantity && quantity.includes('-')) {
      [minQty, maxQty] = quantity.split('-');
    }
    minQty = convert.convertFromFraction(minQty);
    maxQty = convert.convertFromFraction(maxQty);
    quantity = convert.convertFromFraction(minQty);
  
    /* extraInfo will be any info in parantheses. We'll place it at the end of the ingredient.
    For example: "sugar (or other sweetener)" --> extraInfo: "(or other sweetener)" */
    let extraInfo;
    restOfIngredient = restOfIngredient.replace(/^\s*-/, ' ').trim();
    restOfIngredient = restOfIngredient.replace('+', '').trim();
    restOfIngredient = restOfIngredient.replace(/\s\s/gi, ' ').trim();

    if (restOfIngredient.match(/([\w+]+)|(\((?:\(??[^\()]*?\)))|([\w+]+)/g)) {
      extraInfo = restOfIngredient.match(/([\w+]+)|(\((?:\(??[^\()]*?\)))|([\w+]+)|\/\s+([\w+]+)\s+([\w+]+)/g);
      extraInfo = extraInfo.filter(i => i.includes("(") || i.includes("/"));
      extraInfo = extraInfo.map(e => e.replace("(", "").replace(")", ""));
      extraInfo.map(ei => restOfIngredient = restOfIngredient.replace(ei, '').replace("(", "").replace(")", "").trim());
      restOfIngredient = restOfIngredient.replace('   ', ' ').trim();
    }
  
    let commaNote = restOfIngredient.split(',');
    restOfIngredient = commaNote.shift();
    commaNote = commaNote.join(',').trim();
    if (commaNote) extraInfo.push(commaNote);

    let beforeNote = restOfIngredient.split(':');
    restOfIngredient = beforeNote.pop();
    beforeNote = beforeNote.join(',').trim();
    if (beforeNote) extraInfo.push(beforeNote);

    // grab and remove keywords that are extra info
    let extraMethod = [];
    for (let method of methods) {
      extraMethod = restOfIngredient.match(new RegExp(method, "ig"));
      if (extraMethod) {
        const em = extraMethod[0];
        restOfIngredient = restOfIngredient.replace(em, '').trim();
        restOfIngredient = restOfIngredient.replace('   ', ' ').trim();
        extraInfo.push(em);
      }
    }
  
    // grab unit and turn it into non-plural version, for ex: "Tablespoons" OR "Tsbp." --> "tablespoon"
    let [unit, shorthand] = getUnit(restOfIngredient, language);
    const shorthandRegex = new RegExp(`${shorthand}`, 'i');
    let ingredient = restOfIngredient.replace(shorthandRegex, '').trim();
    ingredient = ingredient.split('.').join("").trim();

    // remove unit from the ingredient if one was found and trim leading and trailing whitespace
    let preposition = getPreposition(ingredient.split(' ')[0], language);
  
    if (preposition) {
      let regex = new RegExp('^' + preposition)
      ingredient = ingredient.replace(regex, '').trim()
    }
    if (!unit) {
      unit = 'ea.'
    }
    ingredient = ingredient.replace(/\s\s/gi, ' ');
    ingredient = ingredient.charAt(0).toUpperCase() + ingredient.slice(1);
    return {
      quantity: quantity ? quantity : undefined,
      unit: unit,
      ingredient: ingredient,
      note: extraInfo.length ? extraInfo : undefined,
      minQty: +minQty,
      maxQty: +maxQty,
      original: ingredientLine
    };
  } catch (e) {
    console.log(e)
  }
}

function combine(ingredientArray) {
  const combinedIngredients = ingredientArray.reduce((acc, ingredient) => {
    const key = ingredient.ingredient + ingredient.unit; // when combining different units, remove this from the key and just use the name
    const existingIngredient = acc[key];

    if (existingIngredient) {
      return Object.assign(acc, { [key]: combineTwoIngredients(existingIngredient, ingredient) });
    } else {
      return Object.assign(acc, { [key]: ingredient });
    }
  }, {});

  return Object.keys(combinedIngredients).reduce((acc, key) => {
    const ingredient = combinedIngredients[key];
    return acc.concat(ingredient);
  }, []).sort(compareIngredients);
}

function prettyPrintingPress(ingredient) {
  let quantity = '';
  let unit = ingredient.unit;
  if (ingredient.quantity) {
    const [whole, remainder] = ingredient.quantity.split('.');
    if (+whole !== 0 && typeof whole !== 'undefined') {
      quantity = whole;
    }
    if (+remainder !== 0 && typeof remainder !== 'undefined') {
      let fractional;
      if (repeatingFractions[remainder]) {
        fractional = repeatingFractions[remainder];
      } else {
        const fraction = '0.' + remainder;
        const len = fraction.length - 2;
        let denominator = Math.pow(10, len);
        let numerator = +fraction * denominator;

        const divisor = gcd(numerator, denominator);

        numerator /= divisor;
        denominator /= divisor;
        fractional = Math.floor(numerator) + '/' + Math.floor(denominator);
      }

      quantity += quantity ? ' ' + fractional : fractional;
    }
    /* if (((+whole !== 0 && typeof remainder !== 'undefined') || +whole > 1) && unit) {
       unit = nounInflector.pluralize(unit);
     }*/
  } else {
    return ingredient.ingredient;
  }

  return `${quantity}${unit ? ' ' + unit : ''} ${ingredient.ingredient}`;
}

function gcd(a, b) {
  if (b < 0.0000001) {
    return a;
  }

  return gcd(b, Math.floor(a % b));
}

// TODO: Maybe change this to existingIngredients: Ingredient | Ingredient[]
function combineTwoIngredients(existingIngredients, ingredient) {
  const quantity = existingIngredients.quantity && ingredient.quantity ? (Number(existingIngredients.quantity) + Number(ingredient.quantity)).toString() : null;
  const minQty = existingIngredients.minQty && ingredient.minQty ? (Number(existingIngredients.minQty) + Number(ingredient.minQty)).toString() : null;
  const maxQty = existingIngredients.maxQty && ingredient.maxQty ? (Number(existingIngredients.maxQty) + Number(ingredient.maxQty)).toString() : null;
  return Object.assign({}, existingIngredients, { quantity, minQty, maxQty });
}

function compareIngredients(a, b) {
  if (a.ingredient === b.ingredient) {
    return 0;
  }
  return a.ingredient < b.ingredient ? -1 : 1;
}

module.exports = {
  combine,
  prettyPrintingPress,
  parse
}