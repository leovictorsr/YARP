const request = require("request");
const cheerio = require("cheerio");

const RecipeSchema = require("../helpers/recipe-schema");

const tablespoon = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("tablespoon.com/")) {
      reject(new Error("url provided must include 'tablespoon.com/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $("meta[property='og:title']").attr("content").split("|")[0];

          $(".ingredient")
            .each((i, el) => {
              Recipe.ingredients.push($(el).text().replace(/\s\s+/g, " ").trim());
            });

          $(".recipeStep")
            .each((i, el) => {
              Recipe.instructions.push($(el).text().replace(/\s\s+/g, " ").trim());
            });

          let servings = $($(".rdpAttributes").find("li").get(2)).find(".attributeValue").text();
          if (servings) {
            Recipe.servings = servings.replace(/\s\s+/g, " ").trim();
          }

          let prepTime = $(".rdpAttributes").find("li").first().find(".attributeValue").text();
          if (prepTime) {
            Recipe.time.prep = prepTime.replace(/\s\s+/g, " ").trim();
          }

          let totalTime = $($(".rdpAttributes").find("li").get(1)).find(".attributeValue").text();
          if (totalTime) {
            Recipe.time.total = totalTime.replace(/\s\s+/g, " ").trim();
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

tablespoon("https://www.tablespoon.com/recipes/cookies-and-cream-pudding-shots/d9f3a468-1456-4a61-bbd6-7297e9926d06");

module.exports = tablespoon;
