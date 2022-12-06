const cheerio = require("cheerio");
const puppeteerFetch = require("../helpers/puppeteerFetch");
const RecipeSchema = require("../helpers/recipe-schema");

const yummly = url => {
  return new Promise(async (resolve, reject) => {
    if (!url.includes("yummly.com/recipe")) {
      reject(new Error("url provided must include 'yummly.com/recipe'"));
    } else {
      try {
        const html = await puppeteerFetch(url);
        const Recipe = new RecipeSchema();
        const $ = cheerio.load(html);

        Recipe.name = $("h1.recipe-title").text();
        Recipe.image = $("meta[property='og:image']").attr("content");

        $(".IngredientLine").each((i, el) => {
          Recipe.ingredients.push($(el).text());
        });

        $(".step").each((i, el) => {
          Recipe.instructions.push($(el).text());
        });

        Recipe.time.total =
          $("div.unit")
            .children()
            .first()
            .text() +
          " " +
          $("div.unit")
            .children()
            .last()
            .text();

        Recipe.servings = $(".servings").text().toLowerCase();

        console.log(Recipe)

        if (!Recipe.name || !Recipe.ingredients.length) {
          reject(new Error("No recipe found on page"));
        } else {
          resolve(Recipe);
        }
      } catch (error) {
        console.log(error)
        reject(new Error("No recipe found on page"));
      }
    }
  });
};

module.exports = yummly;
