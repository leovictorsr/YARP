const request = require("request");
const cheerio = require("cheerio");

const RecipeSchema = require("../helpers/recipe-schema");

const food = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("food.com/recipe/")) {
      reject(new Error("url provided must include 'food.com/recipe/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[name='og:image']").attr("content");
          Recipe.name = $("h1").first().text();

          $("ul.ingredient-list").find("li").each((i, el) => {
            const item = $(el)
              .text()
              .replace(/\s\s+/g, " ")
              .trim();
            Recipe.ingredients.push(item);
          });

          $("ul.direction-list").find("li").each((i, el) => {
            const step = $(el)
              .text()
              .replace(/\s\s+/g, "");
            Recipe.instructions.push(step);
          });

          $("dd").each((i, el) => {
            if (i == 0) Recipe.time.total = $(el).text().trim();
            if (i == 2) Recipe.servings = $(el).find("span").text();
          })

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

module.exports = food;
