const request = require("request");
const cheerio = require("cheerio");

const RecipeSchema = require("../helpers/recipe-schema");

const jamieoliver = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("jamieoliver.com/")) {
      reject(new Error("url provided must include 'jamieoliver.com/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $("meta[property='og:title']").attr("content").split("|")[0].trim();

          $(".ingred-list")
            .find("li")
            .each((i, el) => {
              Recipe.ingredients.push($(el).text().replace(/\s\s+/g, " "));
            })

          $(".recipeSteps")
            .find("li")
            .each((i, el) => {
              Recipe.instructions.push($(el).text().trim());
            })

          let servings = $(".recipe-detail.serves").first().text();
          if (servings) {
            Recipe.servings = servings.toLowerCase().replace(/\s\s+/g, " ").replace('serves', '').trim();
          }

          let prepTime = $(".recipe-detail.time").first().text()
          if (prepTime) {
            Recipe.time.prep = prepTime.toLowerCase().replace(/\s\s+/g, " ").replace('cooks in', '').trim();
          }

          let totalTime = $(".recipe-detail.time").first().text()
          if (totalTime) {
            Recipe.time.total = totalTime.toLowerCase().replace(/\s\s+/g, " ").replace('cooks in', '').trim();
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

module.exports = jamieoliver;
