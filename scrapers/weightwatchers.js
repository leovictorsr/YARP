const request = require("request");
const cheerio = require("cheerio");
const RecipeSchema = require("../helpers/recipe-schema");

const weightWatchers = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("www.weightwatchers.com/us/recipe/")) {
      reject(new Error("url provided must include 'www.weightwatchers.com/us/recipe/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $("meta[property='og:title']").attr("content").split("|")[0].trim();

          $("p[class*='IngredientItem_ingredient__name']").each((i, el) => {
            Recipe.ingredients.push($(el).text());
          });

          $("p[class*='IngredientItem_ingredient__description']").each((i, el) => {
            Recipe.ingredients[i] = `${$(el).text()}${Recipe.ingredients[i]}`;
          });

          $("li[class*='InstructionsFood_list-item']").each((i, el) => {
            Recipe.instructions.push(
              $(el).text().replace(/\s\s+/g, "")
            );
          });

          $("div[class*='AttributeItem_wrapper']")
            .each((i, el) => {
              const label = $(el).children("div[class*='AttributeItem_label']").first().text();
              const info = $(el).children("div[class*='AttributeItem_value']").first().text();

              if (label.includes("Total")) {
                Recipe.time.total = info;
              } else if (label.includes("Cook")) {
                Recipe.time.cook = info;
              } else if (label.includes("Prep")) {
                Recipe.time.prep = info;
              } else if (label.includes("Serves")) {
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

module.exports = weightWatchers;
