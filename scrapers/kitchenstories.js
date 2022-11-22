const cheerio = require("cheerio");
const puppeteerFetch = require("../helpers/puppeteerFetch");
const RecipeSchema = require("../helpers/recipe-schema");

const kitchenStories = url => {
  return new Promise(async (resolve, reject) => {
    if (
      !url.includes("kitchenstories.com/en/recipes") &&
      !url.includes("kitchenstories.com/de/rezepte")
    ) {
      reject(
        new Error(
          "url provided must include 'kitchenstories.com/en/recipes' or 'kitchenstories.com/de/rezepte'"
        )
      );
    } else {
      try {
        const html = await puppeteerFetch(url);
        const Recipe = new RecipeSchema();
        const $ = cheerio.load(html);

        Recipe.image = $("meta[property='og:image']").attr("content");
        Recipe.name = $("h1").first().text();

        $("div[data-test='recipe-ingredients-item']")
          .each((i, el) => {
            Recipe.ingredients.push(`${$(el).children().first().text()} ${$(el).children().last().text()}`.trim().replace(/\s\s/, " "));
          });

        $("li[data-test='recipe-steps-item']")
          .find("p")
          .each((i, el) => {
            Recipe.instructions.push($(el).text());
          });

        $("section[data-test='recipe-difficulty']")
          .find("div")
          .each((i, el) => {
            if (i == 1) Recipe.time.prep = $(el).find("div").text();
            if (i == 2) Recipe.time.cook = $(el).find("div").text();
            if (i == 3) Recipe.time.inactive = $(el).find("div").text();
          });

        Recipe.servings = $("span[data-test='recipe-ingredients-servings-count']").text();

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

module.exports = kitchenStories;
