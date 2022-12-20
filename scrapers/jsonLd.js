const request = require("request");
const cheerio = require("cheerio");
const RecipeSchema = require("../helpers/recipe-schema");

const jsonLd = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    request(url, (error, response, html) => {
      if (!error && response.statusCode === 200) {
        const $ = cheerio.load(html);
        const jsonLd = JSON.parse($("script[type='application/ld+json']").text());
        const recipe = jsonLd["@graph"].filter(e => e["@type"] === "Recipe")[0];

        Recipe.name = recipe.name;
        Recipe.image = recipe.image[0];
        Recipe.yield = recipe.yield;
        Recipe.time.prep = recipe.prepTime.replace("PT", "").replace("M", " minutes");
        Recipe.time.cook = recipe.cookTime.replace("PT", "").replace("M", " minutes");
        Recipe.time.total = recipe.totalTime.replace("PT", "").replace("M", " minutes");

        Recipe.ingredients = recipe.recipeIngredient;
        Recipe.instructions = recipe.recipeInstructions.map(e => e.name);
        Recipe.url = url;

        console.log(Recipe);

        if (
          !Recipe.name ||
          !Recipe.ingredients.length ||
          !Recipe.instructions.length
        ) {
          reject(new Error("No recipe found on page"));
        } else {
          resolve(Recipe);
        }
      } else {
        reject(new Error("No recipe found on page"));
      }
    });
  });
};

module.exports = jsonLd;
