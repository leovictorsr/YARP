const cheerio = require("cheerio");
const puppeteerFetch = require("../helpers/puppeteerFetch");
const RecipeSchema = require("../helpers/recipe-schema");

const woolworths = url => {
  return new Promise(async (resolve, reject) => {
    if (!url.includes("woolworths.com.au/shop/recipes/")) {
      reject(new Error("url provided must include 'woolworths.com.au/shop/recipes/'"));
    } else {
      try {
        const html = await puppeteerFetch(url);
        const Recipe = new RecipeSchema();
        const $ = cheerio.load(html);

        Recipe.image = $("meta[property='og:image']").attr("content");
        Recipe.name = $("meta[property='og:title']").attr("content").split("|")[0].trim();

        $("div.ingredient-list").each((i, el) => {
          Recipe.ingredients.push(
            $(el)
              .text()
              .trim()
          );
        });

        $("div.step-content").each((i, el) => {
          Recipe.instructions.push(
            $(el)
              .text()
              .trim()
          );
        });

        $("div.summaryPanel-contentItem--content").each((i, el) => {
          if (i == 0) Recipe.time.prep = $(el).text().trim()
          else if (i == 1) Recipe.time.cook = $(el).text().trim()
          else if (i == 2) Recipe.servings = $(el).text().trim()
        });

        console.log(Recipe);
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
}

module.exports = woolworths;
