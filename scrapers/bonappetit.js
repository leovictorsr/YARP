const request = require("request");
const cheerio = require("cheerio");
const RecipeSchema = require("../helpers/recipe-schema");

const bonAppetit = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("bonappetit.com/recipe/")) {
      reject(new Error("url provided must include 'bonappetit.com/recipe/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $("meta[property='og:title']").attr("content");

          $("div[class*='Description']").each((i, el) => {
            Recipe.ingredients.push($(el).text());
          });

          $("p[class*='Amount']").each((i, el) => {
            Recipe.ingredients[i] = `${$(el).text()} ${Recipe.ingredients[i]}`;
          });

          $("li[class*='InstructionListWrapper']").each((i, el) => {
            $(el).find("p").each((i, el) => {
              Recipe.instructions.push($(el).text().replace(/\s\s+/g, ""))
            })
          });


          Recipe.servings = $("p[class*='Yield']").text();

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

module.exports = bonAppetit;
