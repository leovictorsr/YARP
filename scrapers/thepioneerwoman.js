const request = require("request");
const cheerio = require("cheerio");

const RecipeSchema = require("../helpers/recipe-schema");

const thePioneerWoman = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("thepioneerwoman.com/food-cooking/")) {
      reject(
        new Error(
          "url provided must include 'thepioneerwoman.com/food-cooking/'"
        )
      );
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $("h1")
            .first()
            .text();

          $("ul.ingredient-lists").find("li").each((i, el) => {
            Recipe.ingredients.push(
              $(el)
                .text()
                .replace(/\s\s+/g, " ")
                .trim()
            );
          });

          $("ul.directions")
            .find("li")
            .contents()
            .filter(function () {
              return this.type === "text"
            })
            .each((i, el) => Recipe.instructions.push($(el).text().trim()))

          $("dd")
            .each((i, el) => {
              if (i == 0) Recipe.servings = $(el).find("span").text().trim();
              if (i == 1) Recipe.time.prep = $(el).text().trim();
              if (i == 2) Recipe.time.cook = $(el).text().trim();
              if (i == 3) Recipe.time.total = $(el).text().trim();
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

module.exports = thePioneerWoman;
