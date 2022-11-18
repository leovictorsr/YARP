const request = require("request");
const cheerio = require("cheerio");

const RecipeSchema = require("../helpers/recipe-schema");

const saveur = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("saveur.com/")) {
      reject(new Error("url provided must include 'saveur.com/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $("meta[property='og:title']").attr("content");

          $(".ingredient")
            .each((i, el) => {
              Recipe.ingredients.push($(el).text());
            });

          $(".instruction")
            .each((i, el) => {
              Recipe.instructions.push($(el).text());
            });


          Recipe.time.total = $(".cook-time").text().trim().replace("Time:", "");
          Recipe.servings = $(".yield").text().trim().replace("Yield:", "").replace("serves", "");

          if (
            !Recipe.name ||
            !Recipe.ingredients.length
          ) {
            reject(new Error("No recipe found on page"));
          } else {
            resolve(Recipe);
          }
        } else {
          console.log("HERE IS ERROR: ", response)
          reject(new Error("error: ", response.code));
        }
      });
    }
  });
};

module.exports = saveur;
