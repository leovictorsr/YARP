const request = require("request");
const cheerio = require("cheerio");
const RecipeSchema = require("../helpers/recipe-schema");

const rachaelrayshow = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("rachaelrayshow.com/")) {
      reject(new Error("url provided must include 'rachaelrayshow.com/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $("meta[name='title']").attr("content").split("|")[0].trim();

          $("div[class='recipe-ingredients']").find('li')
            .each((i, el) => {
              Recipe.ingredients.push($(el).text().trim());
            })

          $(".field--name-field-recipe-instructions").find("p").each((i, el) => {
            Recipe.instructions.push($(el).text().trim());
          });

          let servings = $(".yield-value").text();
          if (servings) {
            Recipe.servings = servings.toLowerCase();
          }

          let totalTime = $("meta[itemprop=totalTime]").attr("content");
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

module.exports = rachaelrayshow;
