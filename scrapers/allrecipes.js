const request = require("request");
const cheerio = require("cheerio");
const RecipeSchema = require("../helpers/recipe-schema");

const allRecipes = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("allrecipes.com/recipe")) {
      reject(new Error("url provided must include 'allrecipes.com/recipe'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);
          parseRecipe($, Recipe);
          resolve(Recipe);
        } else {
          reject(new Error("No recipe found on page"));
        }
      });
    }
  });
};

const parseRecipe = ($, Recipe) => {
  Recipe.name = $("meta[property='og:title']").attr("content");
  Recipe.image = $("meta[property='og:image']").attr("content");

  $(".mntl-recipe-details__item").each((i, el) => {
    const title = $(el)
      .children(".mntl-recipe-details__label")
      .text()
      .replace(/\s*:|\s+(?=\s*)/g, "");
    const value = $(el)
      .children(".mntl-recipe-details__value")
      .text()
      .replace(/\s\s+/g, "");
    switch (title) {
      case "PrepTime":
        Recipe.time.prep = value;
        break;
      case "CookTime":
        Recipe.time.cook = value;
        break;
      case "TotalTime":
        Recipe.time.total = value;
        break;
      case "Yield":
        Recipe.servings = value;
        break;
      default:
        break;
    }
  });

  $("li.mntl-structured-ingredients__list-item ").each((i, el) => {
    const ingredient = $(el)
      .text()
      .replace(/\s\s+/g, " ")
      .trim();
    Recipe.ingredients.push(ingredient);
  });

  $($("div.recipe__steps-content").find("li")).each((i, el) => {
    const instruction = $(el).find("p").text().replace(/\n/g, "");
    Recipe.instructions.push(instruction);
  });
};

module.exports = allRecipes;
