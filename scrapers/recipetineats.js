const request = require("request");
const cheerio = require("cheerio");
const RecipeSchema = require("../helpers/recipe-schema");

const recipeTinEats = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("recipetineats.com/")) {
      reject(new Error("url provided must include 'recipetineats.com/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("div.wprm-recipe-image").find("img").attr("src");
          Recipe.name = $("h2.wprm-recipe-name").text();

          $("li.wprm-recipe-ingredient").each((i, el) => {
            Recipe.ingredients.push($(el).text().substring(2).trim());
          });

          $("li.wprm-recipe-instruction").each((i, el) => {
            Recipe.instructions.push($(el).text().trim());
          });

          Recipe.servings = $("span.wprm-recipe-servings-with-unit").text();

          Recipe.time.total = $("div.wprm-recipe-total-time-container").find("span.wprm-recipe-time").text();
          Recipe.time.prep = $("div.wprm-recipe-prep-time-container").find("span.wprm-recipe-time").text();
          Recipe.time.cook = $("div.wprm-recipe-cook-time-container").find("span.wprm-recipe-time").text();

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
    }
  });
};

module.exports = recipeTinEats;
