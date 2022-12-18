const RecipeSchema = require("../helpers/recipe-schema");
const puppeteerFetch = require("../helpers/puppeteerFetch");
const cheerio = require("cheerio");

const damnDelicious = url => {
  return new Promise(async (resolve, reject) => {
    if (!url.includes("damndelicious.net")) {
      reject(new Error("url provided must include 'damndelicious.net'"));
    } else {
      try {
        const html = await puppeteerFetch(url);
        const Recipe = new RecipeSchema();
        const $ = cheerio.load(html);

        Recipe.image = $("meta[property='og:image']").attr("content");
        Recipe.name = $(".wprm-recipe-name").text();

        $("li.wprm-recipe-ingredient").each((i, el) => {
          Recipe.ingredients.push($(el).text());
        });

        $("li.wprm-recipe-instruction").each((i, el) => {
          Recipe.instructions.push($(el).text());
        });

        Recipe.servings = $("span.wprm-recipe-servings-with-unit").text();
        $("span.wprm-recipe-time").each((i, el) => {
          if (i == 0) Recipe.time.prep = $(el).text();
          if (i == 1) Recipe.time.cook = $(el).text();
          if (i == 2) Recipe.time.total = $(el).text();
        })

        if (
          !Recipe.name ||
          !Recipe.ingredients.length ||
          !Recipe.instructions.length
        ) {
          reject(new Error("No recipe found on page"));
        } else {
          resolve(Recipe);
        }
      } catch (error) {
        reject(new Error("No recipe found on page"));
      }
    }
  });
};

module.exports = damnDelicious;
