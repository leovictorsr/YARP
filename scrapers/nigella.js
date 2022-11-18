const request = require("request");
const cheerio = require("cheerio");

const RecipeSchema = require("../helpers/recipe-schema");

const nigella = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("nigella.com/")) {
      reject(new Error("url provided must include 'nigella.com/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $("meta[property='og:title']").attr("content");

          $("*[itemprop = 'recipeIngredient']").each((i, el) => {
            Recipe.ingredients.push(
              $(el)
                .text()
                .trim()
            );
          });

          $("*[itemprop = 'recipeInstructions']")
            .find("ol")
            .find("li")
            .each((i, el) => {
              Recipe.instructions.push($(el).text());
            });

          let servings = $("*[itemprop = 'recipeYield']").text()

          if (servings) {
            Recipe.servings = servings.toLowerCase().replace(":", "").replace("makes", "").trim()
          }
          if (
            !Recipe.name ||
            !Recipe.ingredients.length) {
            reject(new Error("No recipe found on page", Recipe));
          } else {
            resolve(Recipe);
          }
        } else {
          console.log("SERVER RESPONSE: ", response.statusCode)
          reject(new Error("Server error"));
        }
      });
    }
  });
};

module.exports = nigella;
