const request = require("request");
const cheerio = require("cheerio");

const RecipeSchema = require("../helpers/recipe-schema");

const foodAndWine = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("foodandwine.com/recipes/")) {
      reject(new Error("url provided must include 'foodandwine.com/recipes/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $("meta[property='og:title']").attr("content");

          $("li.mntl-structured-ingredients__list-item")
            .each((i, el) => {
              Recipe.ingredients.push(
                $(el)
                  .text()
                  .trim()
              );
            });

          $("div.recipe__steps-content")
            .find("li")
            .each((i, el) => {
              Recipe.instructions.push($(el).text().trim().replace(/\n\n/, ""));
            });

          $("div.mntl-recipe-details__item").each((i, el) => {
            if (i == 0) Recipe.time.active = $(el).find(".mntl-recipe-details__value").text();
            if (i == 1) Recipe.time.total = $(el).find(".mntl-recipe-details__value").text();
            if (i == 2) Recipe.servings = $(el).find(".mntl-recipe-details__value").text();
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

module.exports = foodAndWine;
