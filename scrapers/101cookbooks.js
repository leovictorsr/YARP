const request = require("request");
const cheerio = require("cheerio");

const RecipeSchema = require("../helpers/recipe-schema");

const oneHundredAndOne = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("101cookbooks.com/")) {
      reject(new Error("url provided must include '101cookbooks.com/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);
          const body = $(".wprm-recipe-container");

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = body.children("h2").text();

          $("li[class$='recipe-ingredient']").each((i, el) => {
            Recipe.ingredients.push(
              $(el)
                .text()
                .replace(/\s\s+/g, " ")
                .trim()
            );
          });

          $("li[class$='recipe-instruction']").each((i, el) => {
            Recipe.instructions.push(
              $(el)
                .text()
                .replace(/\s\s+/g, " ")
                .trim()
            );
          });

          Recipe.servings = $("div[class$='recipe-notes-container']").find("p").text().trim();

          $("div[class$='recipe-time']").each((i, el) => {
             if (i == 0) Recipe.time.prep = $(el).text().trim()
             if (i == 1) Recipe.time.cook = $(el).text().trim()
             if (i == 2) Recipe.time.total = $(el).text().trim()
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

module.exports = oneHundredAndOne;
