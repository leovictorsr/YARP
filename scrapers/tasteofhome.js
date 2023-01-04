const request = require("request");
const cheerio = require("cheerio");
const RecipeSchema = require("../helpers/recipe-schema");

const tasteofhome = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("tasteofhome.com/")) {
      reject(new Error("url provided must include 'tasteofhome.com/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $("meta[property='og:title']").attr("content").split("|")[0];

          $(".recipe-ingredients__list")
            .find("li")
            .each((i, el) => {
              Recipe.ingredients.push($(el).text().replace(/\s\s+/g, " ").trim());
            });

          $(".recipe-directions__list")
            .find("li")
            .each((i, el) => {
              Recipe.instructions.push($(el).text().replace(/\s\s+/g, " ").trim());
            });

          let servings = $(".makes").find("p").text();
          if (servings) {
            Recipe.servings = servings.trim();
          }

          let time = $(".total-time").text();

          if (time.match(/Prep: \d+ \w+/gi)) {
            let prepTime = time.match(/Prep: \d+ \w+/gi);
            Recipe.time.prep = prepTime[0].split(":")[1].trim();
          }

          if (time.match(/Cook: \d+ \w+/gi)) {
            let cookTime = time.match(/Cook: \d+ \w+/gi);
            Recipe.time.cook = cookTime[0].split(":")[1].trim();
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

module.exports = tasteofhome;
