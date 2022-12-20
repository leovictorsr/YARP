const puppeteerFetch = require("../helpers/puppeteerFetch");
const cheerio = require("cheerio");
const RecipeSchema = require("../helpers/recipe-schema");

const jsonLd = url => {
  return new Promise(async (resolve, reject) => {
    try {
      const Recipe = new RecipeSchema();
      const html = await puppeteerFetch(url);
      const $ = cheerio.load(html);

      const jsonLd = JSON.parse($("script[type='application/ld+json']").text());
      let recipe;
      if (jsonLd["@graph"]) recipe = jsonLd["@graph"].filter(e => e["@type"] === "Recipe")[0];
      else recipe = jsonLd;

      Recipe.name = recipe.name;
      Recipe.image = recipe.image[0].contentUrl ? recipe.image[0].contentUrl : recipe.image[0];
      Recipe.servings = recipe.recipeYield.toString();
      if (recipe.prepTime) Recipe.time.prep = recipe.prepTime.replace("PT", "").replace("H", " hours ").replace("M", " minutes").trim();
      if (recipe.cookTime) Recipe.time.cook = recipe.cookTime.replace("PT", "").replace("H", " hours ").replace("M", " minutes").trim();
      if (recipe.totalTime) Recipe.time.total = recipe.totalTime.replace("PT", "").replace("H", " hours ").replace("M", " minutes").trim();

      Recipe.ingredients = recipe.recipeIngredient.map(e => e.replace("))", ")").replace("((", "("));
      Recipe.instructions = recipe.recipeInstructions.map(e => e.text ? e.text : e.name);
      Recipe.url = url;


      if (
        !Recipe.name ||
        !Recipe.ingredients.length ||
        !Recipe.instructions.length
      ) {
        reject(new Error("No recipe found on page"));
      } else {
        resolve(Recipe);
      }
    } catch (e) {
      reject(new Error("No recipe found on page: " + e));
    }
  });
};

module.exports = jsonLd;
