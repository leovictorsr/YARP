const request = require("request");
const cheerio = require("cheerio");

const RecipeSchema = require("../helpers/recipe-schema");

const simplyRecipes = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("simplyrecipes.com")) {
      reject(
        new Error("url provided must include 'simplyrecipes.com'")
      );
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $("meta[itemprop='name']").attr("content");

          $(".ingredient-list")
            .find("li.ingredient, p")
            .each((i, el) => {
              Recipe.ingredients.push($(el).text().trim());
            });

          $(".comp.mntl-sc-block-group--OL.mntl-sc-block.mntl-sc-block-startgroup")
            .find("li")
            .each((i, el) => {
              let curEl = $(el).text().trim();
              if (curEl) {
                Recipe.instructions.push(curEl.replace(/\r?\n|\r/g, "").replace(/\s\s/, " ").replace("Vivian Jao", "").trim());
              }
            });

          $(".project-meta__times-container")
            .children(".loc")
            .each((i, el) => {
              const label = $(el).children().first().children(".meta-text__label").first().text();
              const info = $(el).children().first().children(".meta-text__data").first().text();

              if (label.includes("Prep")) {
                Recipe.time.prep = info;
              } else if (label.includes("Cook")) {
                Recipe.time.cook = info;
              } else if (label.includes("Total")) {
                Recipe.time.total = info;
              }
            });
          Recipe.servings = $(".loc.recipe-serving.project-meta__recipe-serving").find(".meta-text__data").text();

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

module.exports = simplyRecipes;
