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
        Recipe.name = $(".recipe-title").text();

        $(".ingredients")
          .find("tr")
          .each((i, el) => {
            Recipe.ingredients.push($(el).text());
          });

        $(".step")
          .children(".text")
          .each((i, el) => {
            Recipe.instructions.push($(el).text());
          });

        $(".time-cell").each((i, el) => {
          let title = $(el)
            .children(".title")
            .text();
          let time = $(el)
            .find(".time")
            .text();
          let unit = $(el)
            .find(".unit")
            .text();
          if (parseInt(time)) {
            switch (title) {
              case "Preparation":
              case "Zubereitung":
                Recipe.time.prep = `${time} ${unit}`;
                break;
              case "Baking":
              case "Backzeit":
                Recipe.time.cook = `${time} ${unit}`;
                break;
              case "Resting":
              case "Ruhezeit":
                Recipe.time.inactive = `${time} ${unit}`;
                break;
              default:
            }
          }
        });

        Recipe.servings = $(".stepper-value").text();
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

kitchenStories('https://www.kitchenstories.com/en/recipes/pasta-al-limone').then(recipe => console.log(recipe))

module.exports = kitchenStories;
