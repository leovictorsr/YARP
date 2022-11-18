const request = require("request");
const cheerio = require("cheerio");

const RecipeSchema = require("../helpers/recipe-schema");

const TasteCooking = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("tastecooking.com/")) {
      reject(new Error("url provided must include 'tastecooking.com/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $("meta[property='og:title']").attr("content");


          $(".recipe-body-ingredient").each((i, el) => {
            var ingredientString = ""
            var quantity = $(el).find(".recipe-body-ingredient-quantity").find(".ingredient-number").text().trim();
            var quant_label = $(el).find(".recipe-body-ingredient-quantity").find(".ingredient-label").text().trim();
            if (quant_label === "c") {
              quant_label = "cups"
            }
            var ingredient = $(el).find(".recipe-body-ingredient-name").text().trim();
            ingredientString = ingredientString.concat(quantity, " ", quant_label, ingredient);
            Recipe.ingredients.push(ingredientString);
          })

          Recipe.servings = $('[itemprop="recipeYield"]')
            .children(".recipe-stats-quantity")
            .text()
            .trim();

          $(".recipe-body-list-container").find("li").each((i, el) => {
            Recipe.instructions.push($(el).text().trim());
          })

          if (
            !Recipe.name ||
            !Recipe.ingredients.length
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

module.exports = TasteCooking;