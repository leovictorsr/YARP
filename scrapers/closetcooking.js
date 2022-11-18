const cheerio = require("cheerio");
const request = require("request");

const RecipeSchema = require("../helpers/recipe-schema");

const closetCooking = url => {
  const Recipe = new RecipeSchema();
  return new Promise(async (resolve, reject) => {
    if (!url.includes("closetcooking.com")) {
      reject(
        new Error("url provided must include 'closetcooking.com'")
      );
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $(".recipe_title").text();

          $(".ingredients")
            .children("h6, li")
            .each((i, el) => {
              Recipe.ingredients.push($(el).text());
            });

          $(".instructions")
            .children("h6, li")
            .each((i, el) => {
              Recipe.instructions.push($(el).text());
            });

          let metaData = $(".time");
          let prepText = metaData.first().text();
          Recipe.time.prep = prepText.slice(prepText.indexOf(":") + 1).trim();
          let cookText = $(metaData.get(1)).text();
          Recipe.time.cook = cookText.slice(cookText.indexOf(":") + 1).trim();
          let totalText = $(metaData.get(2)).text();
          Recipe.time.total = totalText.slice(totalText.indexOf(":") + 1).trim();

          let servingsText = $(".yield").text();
          Recipe.servings = servingsText
            .slice(servingsText.indexOf(":") + 1)
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
      })
    }
  })
};

module.exports = closetCooking;