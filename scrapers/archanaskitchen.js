const request = require("request");
const cheerio = require("cheerio");

const RecipeSchema = require("../helpers/recipe-schema");

const archanaskitchen = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("archanaskitchen.com/")) {
      reject(new Error("url provided must include 'archanaskitchen.com/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $("meta[property='og:title']").attr("content");

          $("*[itemprop = 'ingredients']").each((i, el) => {
            Recipe.ingredients.push(
              $(el)
                .text()
                .trim()
            );
          });

          $("*[itemprop = 'recipeInstructions']")
            .each((i, el) => {
              Recipe.instructions.push($(el).text());
            });

          let servings = $("*[itemprop = 'recipeYield']").text()
          if (servings) {
            Recipe.servings = servings.toLowerCase().replace(":", "").replace("makes", "").trim()
          }

          let prepTime = $("*[itemprop = 'prepTime']").text()
          if (prepTime) {
            Recipe.time.prep = prepTime ? prepTime.match(/\d+\sM/)[0] : ""
          }

          let cookTime = $("*[itemprop = 'cookTime']").text()
          if (cookTime) {
            Recipe.time.cook = cookTime ? cookTime.match(/\d+\sM/)[0] : ""
          }

          let totalTime = $("*[itemprop = 'totalTime']").text()
          if (totalTime) {
            Recipe.time.total = totalTime ? totalTime.match(/\d+\sM/)[0] : ""
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

module.exports = archanaskitchen;
