const request = require("request");
const cheerio = require("cheerio");

const RecipeSchema = require("../helpers/recipe-schema");

const theWoksOfLife = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("thewoksoflife.com/")) {
      reject(new Error("url provided must include 'thewoksoflife.com/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $("meta[property='og:title']").attr("content");


          $(".wprm-recipe-ingredient")
            .each((i, el) => {
              Recipe.ingredients.push($(el).text());
            });

            $(".wprm-recipe-instruction-text")
            .each((i, el) => {
              Recipe.instructions.push($(el).text());
            });

          var prepTime = $(".wprm-recipe-prep-time-container")
          .find(".wprm-recipe-prep_time").text()
          var prepMin = $(".wprm-recipe-prep-time-container")
          .find(".wprm-recipe-prep_time-unit").text()
          Recipe.time.prep = prepTime.concat(" ").concat(prepMin)

          var cookTime = $(".wprm-recipe-cook-time-container")
          .find(".wprm-recipe-cook_time").text()
          var cookMin = $(".wprm-recipe-cook-time-container")
          .find(".wprm-recipe-cook_time-unit").text()
          Recipe.time.cook = cookTime.concat(" ").concat(cookMin)

          var totalTime = $(".wprm-recipe-total-time-container")
          .find(".wprm-recipe-total_time").text()
          var totalMin = $(".wprm-recipe-total-time-container")
          .find(".wprm-recipe-total_time-unit").text()
          Recipe.time.total = totalTime.concat(" ").concat(totalMin)

          Recipe.servings = $(".wprm-recipe-servings").text()

          if (
            !Recipe.name ||
            !Recipe.ingredients.length          ) {
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

module.exports = theWoksOfLife;
