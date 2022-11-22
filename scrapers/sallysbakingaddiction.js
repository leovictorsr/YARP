const request = require("request");
const cheerio = require("cheerio");

const RecipeSchema = require("../helpers/recipe-schema");

const sallysbakingaddiction = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("sallysbakingaddiction.com/")) {
      reject(new Error("url provided must include 'sallysbakingaddiction.com/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $("meta[property='og:title']").attr("content").split("|")[0];

          $(".tasty-recipes-ingredients")
            .find("li")
            .each((i, el) => {
              Recipe.ingredients.push($(el).text().trim());
            });

          $(".tasty-recipes-instructions")
            .find("li")
            .each((i, el) => {
              Recipe.instructions.push($(el).text().trim());
            });

          let servings = $(".tasty-recipes-yield").text();
          if (servings) {
            Recipe.servings = servings.trim();
          }

          let prepTime = $(".tasty-recipes-prep-time").text();
          if (prepTime) {
            Recipe.time.prep = prepTime.trim();
          }

          let cookTime = $(".tasty-recipes-cook-time").text();
          if (cookTime) {
            Recipe.time.cook = cookTime.trim();
          }

          let totalTime = $(".tasty-recipes-total-time").text();
          if (totalTime) {
            Recipe.time.total = totalTime.trim();
          }

          if (
            !Recipe.name ||
            !Recipe.ingredients.length ||
            !Recipe.instructions.length) {
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

module.exports = sallysbakingaddiction;
