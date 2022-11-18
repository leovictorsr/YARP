const request = require("request");
const cheerio = require("cheerio");

const RecipeSchema = require("../helpers/recipe-schema");

const bbcGoodFood = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("bbcgoodfood.com/recipes/")) {
      reject(new Error("url provided must include 'bbcgoodfood.com/recipes/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[name='og:image']").attr("content");
          Recipe.name = $("meta[name='og:title']").attr("content");

          $(".pb-xxs.pt-xxs.list-item.list-item--separator").each((i, el) => {
            $(el)
              .find("p, h2, span")
              .remove();
            Recipe.ingredients.push($(el).text().trim());
          });

          $(".pb-xs.pt-xs.list-item").each((i, el) => {
            $(el)
              .find("span")
              .remove();
            Recipe.instructions.push($(el).text());
          });

          let metaTime = $("time");

          Recipe.time.prep = metaTime
            .first()
            .text()
            .trim();
          Recipe.time.cook = $(metaTime.get(1))
            .text()
            .trim();

          Recipe.servings = $(".masthead__servings")
            .first()
            .text()
            .trim();

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

module.exports = bbcGoodFood;
