const request = require("request");
const cheerio = require("cheerio");

const RecipeSchema = require("../helpers/recipe-schema");

const delish = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("delish.com/")) {
      reject(new Error("url provided must include 'delish.com/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $("header").find("h1").text();

          $("ul.ingredient-lists").find("li")
            .each((i, el) => {
              Recipe.ingredients.push($(el).text());
            })

          $("ul.directions")
            .find("ol")
            .find("li")
            .each((i, el) => {
              var $instruction = $(el).contents().filter(function() {
                return this.nodeType === 3;
              });
              Recipe.instructions.push($instruction.text().trim().replace(/\n/, ""));
            })

          $("dd").each((i, el) => {
            if (i == 0) Recipe.servings = $(el).find("span").text();
            if (i == 1) Recipe.time.prep = $(el).text().trim();
            if (i == 2) Recipe.time.total = $(el).text().trim();
          })

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

module.exports = delish;
