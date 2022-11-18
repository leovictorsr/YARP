const parse = require('./nlp_parser').parse;
const LANGUAGE = 'eng';

const cleanup = (i) => {
    const cleanedIngredient = i.replace("–", "-").replace(' /', '/').toLowerCase();
    return cleanedIngredient;
};

const groupRegex = /^\w+\:/gi;

const parseIngredient = (ingredients) => {
    let parsedIngredients = [];
    let group = [];
    let currentGroup = "";
    if (Array.isArray(ingredients)) {
        const hasGroup = ingredients.reduce((prev, curr) => prev || curr.match(groupRegex), false);
        for (let i of ingredients) {
            let parsedIngredient = parse(cleanup(i), LANGUAGE);

            if (!hasGroup) {
                parsedIngredients.push(parsedIngredient);
            }
            else if (hasGroup && i.match(groupRegex)) {
                currentGroup = i.match(groupRegex)[0].replace(":", "").trim();
                if (group.length) {
                    parsedIngredients.push(group);
                    group = [];
                }
            }
            else if (hasGroup) {
                parsedIngredient.group = currentGroup;
                group.push(parsedIngredient);
            }
        }

        if (group.length) parsedIngredients.push(group);
    }

    return parsedIngredients;
};

module.exports = parseIngredient;
