const request = require("request");
const cheerio = require("cheerio");

const RecipeSchema = require("../helpers/recipe-schema");

const vegRecipesOfIndia = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("vegrecipesofindia.com/")) {
      reject(new Error("url provided must include 'vegrecipesofindia.com/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $("meta[property='og:title']").attr("content");

          $(".wprm-recipe-ingredients")
            .find("li")
            .each((i, el) => {
              $(el).find('.wprm-checkbox-container').remove();
              Recipe.ingredients.push($(el).text());
            });

          $(".wprm-recipe-instructions")
            .find("li")
            .each((i, el) => {
              Recipe.instructions.push($(el).text());
            });

          Recipe.time.prep = $(".wprm-recipe-prep-time-container").find(".wprm-recipe-time").text();
          Recipe.time.cook = $(".wprm-recipe-cook-time-container").find(".wprm-recipe-time").text();
          Recipe.time.total = $(".wprm-recipe-total-time-container").find(".wprm-recipe-time").text();

          Recipe.servings = $(".wprm-recipe-servings-with-unit")
            .text()
            .trim();

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

module.exports = vegRecipesOfIndia;
