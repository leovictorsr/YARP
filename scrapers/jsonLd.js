const puppeteerFetch = require("../helpers/puppeteerFetch");
const cheerio = require("cheerio");
const RecipeSchema = require("../helpers/recipe-schema");

const jsonLd = url => {
  return new Promise(async (resolve, reject) => {
    const Recipe = new RecipeSchema();
    const html = await puppeteerFetch(url);
    const $ = cheerio.load(html);

    const jsonLd = JSON.parse($("script[type='application/ld+json']").first().text());
    let recipeJsonLd;

    if (jsonLd["@graph"]) recipeJsonLd = jsonLd["@graph"].filter(e => e["@type"].toString().includes("Recipe"))[0];
    else if (jsonLd.length > 0) recipeJsonLd = jsonLd[0]
    else recipeJsonLd = jsonLd;

    Recipe.name = recipeJsonLd.name;

    if (typeof recipeJsonLd.image == "object" && !recipeJsonLd.image.hasOwnProperty("length")) Recipe.image = recipeJsonLd.image.url
    else if (recipeJsonLd.image[0].contentUrl != undefined) Recipe.image = recipeJsonLd.image[0].contentUrl
    else if (recipeJsonLd.image[0].url != undefined) Recipe.image = recipeJsonLd.image[0].url
    else Recipe.image = recipeJsonLd.image[0]

    if (recipeJsonLd.recipeYield) Recipe.servings = recipeJsonLd.recipeYield.toString();
    if (recipeJsonLd.prepTime) Recipe.time.prep = recipeJsonLd.prepTime.replace("PT", "").replace("H", " hours ").replace("M", " minutes").trim();
    if (recipeJsonLd.cookTime) Recipe.time.cook = recipeJsonLd.cookTime.replace("PT", "").replace("H", " hours ").replace("M", " minutes").trim();
    if (recipeJsonLd.totalTime) Recipe.time.total = recipeJsonLd.totalTime.replace("PT", "").replace("H", " hours ").replace("M", " minutes").trim();

    Recipe.ingredients = recipeJsonLd.recipeIngredient.map(e => e.replace("))", ")").replace("((", "("));
    if (recipeJsonLd.recipeInstructions) Recipe.instructions = recipeJsonLd.recipeInstructions.map(e => e.text ? e.text : e.name);
    Recipe.url = url;
    
    resolve(Recipe);
  });
};

module.exports = jsonLd;
