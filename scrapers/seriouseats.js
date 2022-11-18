const request = require("request");
const cheerio = require("cheerio");
const RecipeSchema = require("../helpers/recipe-schema");

const seriousEats = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("seriouseats.com/")) {
      reject(new Error("url provided must include 'seriouseats.com/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);
          if (url.includes("seriouseats.com/sponsored/")) {
            reject(
              new Error("seriouseats.com sponsored recipes not supported")
            );
          } else {
            Recipe.name = $("meta[property='og:title']").attr("content");
            Recipe.image = $("meta[property='og:image']").attr("content");

            $(".structured-ingredients__list-item").each((i, el) => {
              const item = $(el).text().trim();
              Recipe.ingredients.push(item);
            });

            $(".project-meta__times-container")
              .children(".loc")
              .each((i, el) => {
                const label = $(el).children().first().children(".meta-text__label").first().text();
                const info = $(el).children().first().children(".meta-text__data").first().text();

                if (label.includes("Active")) {
                  Recipe.time.active = info;
                } else if (label.includes("Total")) {
                  Recipe.time.total = info;
                }
              });
            Recipe.servings = $(".loc.recipe-serving.project-meta__recipe-serving").find(".meta-text__data").text().replace("\n", " ");

            $(".comp.mntl-sc-block-group--LI.mntl-sc-block.mntl-sc-block-startgroup").each((i, el) => {
              Recipe.instructions.push(
                $(el)
                  .text()
                  .replace(/\s\s+/g, "")
              );
            });

          }

          if (
            !Recipe.name ||
            !Recipe.ingredients.length) {
            reject(new Error("No recipe found on page", Recipe.name, Recipe.ingredients, Recipe.instructions));
          } else {
            resolve(Recipe);
          }
        } else {
          console.log("NO RECIPE FOUND in error loop!!!  ", error)
          reject(new Error(error));
        }
      });
    }
  });
};

module.exports = seriousEats;
