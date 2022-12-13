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

        Recipe.image = $("aem-page").find("meta[property='og:image']").attr("content");
        Recipe.name = $("aem-page").find("h1.recipeTitle-text").text().trim();

        $("aem-page").find("div.ingredient-list").each((i, el) => {
          Recipe.ingredients.push(
            $(el).find("div").first()
              .text()
              .trim()
          );
        });

        $("aem-page").find("aem-shared-content.step-content").each((i, el) => {
          Recipe.instructions.push(
            $(el)
              .text()
              .trim()
          );
        });

        $("aem-page").find("div.summaryPanel-contentItem--content").each((i, el) => {
          if (i == 0) Recipe.time.prep = $(el).text().trim()
          else if (i == 1) Recipe.time.cook = $(el).text().trim()
          else if (i == 2) Recipe.servings = $(el).text().trim()
        });

        console.log(Recipe)

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
