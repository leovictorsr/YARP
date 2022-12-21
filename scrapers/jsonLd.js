const puppeteerFetch = require("../helpers/puppeteerFetch");
const cheerio = require("cheerio");
const RecipeSchema = require("../helpers/recipe-schema");
const { engNameToSymbol } = require("../ingr_parser/units");

const clean = s => {
  return s.toString()
          .replace("PT", "")
          .replace("H", " hours ")
          .replace("M", " minutes")
          .replace("))", ")")
          .replace("((", "(")
          .trim()
}

const checkObject = (o, k) => {
  if (typeof o == 'object') return o[k]
  else if (Array.isArray(o)) return o[0][k]
  else return o
}

const jsonLd = url => {
  return new Promise(async (resolve, reject) => {
    const Recipe = new RecipeSchema();
    const html = await puppeteerFetch(url);
    const $ = cheerio.load(html);

    const jsonLd = JSON.parse($("script[type='application/ld+json']").first().text());
    let recipeJsonLd;

    if (jsonLd["@graph"]) recipeJsonLd = jsonLd["@graph"].filter(e => e["@type"].toString().includes("Recipe"))[0];
    else if (Array.isArray(jsonLd)) recipeJsonLd = jsonLd.filter(e => e["@type"].toString().includes("Recipe"))[0];
    else recipeJsonLd = jsonLd;

    Recipe.name = recipeJsonLd.name;

    Recipe.image = checkObject(recipeJsonLd.image, "url");
    console.log(Recipe.image, recipeJsonLd)
    if (!Recipe.image) Recipe.image = checkObject(recipeJsonLd.image, "contentUrl")
    if (!Recipe.image) Recipe.image = checkObject(recipeJsonLd.image, "url")

    if (recipeJsonLd.recipeYield) Recipe.servings = recipeJsonLd.recipeYield.toString();
    if (recipeJsonLd.prepTime) Recipe.time.prep = clean(checkObject(recipeJsonLd.prepTime, "maxValue"));
    if (recipeJsonLd.cookTime) Recipe.time.cook = clean(checkObject(recipeJsonLd.cookTime, "maxValue"));
    if (recipeJsonLd.totalTime) Recipe.time.total = clean(checkObject(recipeJsonLd.totalTime, "maxValue"));

    Recipe.ingredients = recipeJsonLd.recipeIngredient.map(e => clean(e));
    if (recipeJsonLd.recipeInstructions) 
      if (Array.isArray(recipeJsonLd.recipeInstructions))
        Recipe.instructions = recipeJsonLd.recipeInstructions.map(e => e.text ? e.text : e.name);
      else if (typeof recipeJsonLd.recipeInstructions == 'string') {
        const $$ = cheerio.load(recipeJsonLd.recipeInstructions);
        $$("li").each((i, el) => {
          Recipe.instructions.push($$(el).text());
        })
      }
    Recipe.url = url;
    
    resolve(Recipe);
  });
};

module.exports = jsonLd;
