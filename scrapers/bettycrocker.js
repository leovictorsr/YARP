const request = require("request");
const cheerio = require("cheerio");

const RecipeSchema = require("../helpers/recipe-schema");

const bettyCrocker = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("bettycrocker.com")) {
      reject(
        new Error("url provided must include 'bettycrocker.com'")
      );
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $("meta[property='og:title']").attr("content");

          $(".ingredient")
            .each((i, el) => {
              Recipe.ingredients.push($(el).text().replace(/\s\s\s/g, "").replace(/\r?\n|\r/g, "").trim());
            });

          $(".recipeStep")
            .each((i, el) => {
              Recipe.instructions.push($(el).text().replace(/\s\s\s\s/g, "").replace(/\s\s/g, " ").replace(/\r?\n|\r/g, "").trim());
            });

          $(".rdpAttributes")
            .first()
            .find(".attribute")
            .each((i, el) => {
              const label = $(el).find('.attributeLabel').first().text().replace(/\s\s/g, "").replace(/\r?\n|\r/g, "").trim();
              const info = $(el).find(".attributeValue").first().text().replace(/\s\s/g, "").replace(/\r?\n|\r/g, "").trim();

              if (label.includes("Prep")) {
                Recipe.time.prep = info;
              } else if (label.includes("Cook")) {
                Recipe.time.cook = info;
              } else if (label.includes("Total")) {
                Recipe.time.total = info;
              } else if (label.includes("Servings")) {
                Recipe.servings = info;
              }
            });

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

bettyCrocker("https://www.bettycrocker.com/recipes/smoky-black-bean-and-corn-empanadas/efe1d1a6-4312-424d-927e-47b1aa300f2f");

module.exports = bettyCrocker;
