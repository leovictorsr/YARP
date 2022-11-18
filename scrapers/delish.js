const request = require("request");
const cheerio = require("cheerio");

const RecipeSchema = require("../helpers/recipe-schema");

const delish = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("delish.com/")) {
      reject(new Error("url provided must include 'delish.com/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $("meta[property='og:title']").attr("content");

          $(".ingredient-item")
            .each((i, el) => {
              let quantity = $(el).find('.ingredient-amount').text().trim();
              quantity = quantity.replace(/\s\s+/g, " ")
              let description = $(el).find('.ingredient-description').text().trim();
              description = description.replace(/\s\s+/g, " ")

              Recipe.ingredients.push(`${quantity} ${description}`);
            })

          $(".direction-lists")
            .find("li")
            .each((i, el) => {
              Recipe.instructions.push($(el).text().trim());
            })

          let servings = $(".yields-amount").text();
          if (servings) {
            Recipe.servings = servings.toLowerCase().replace(/\s\s+/g, " ").trim();
          }

          let prepTime = $(".prep-time-amount").first().text()
          if (prepTime) {
            Recipe.time.prep = prepTime.replace(/\s\s+/g, " ").trim();
          }

          let cookTime = $(".cook-time-amount").first().text()
          if (cookTime) {
            Recipe.time.cook = cookTime.replace(/\s\s+/g, " ").trim();
          }

          let totalTime = $(".total-time-amount").first().text()
          if (totalTime) {
            Recipe.time.total = totalTime.replace(/\s\s+/g, " ").trim();
          }

          if (
            !Recipe.name ||
            !Recipe.ingredients.length ||
            !Recipe.instructions.length) {
            reject(new Error("No recipe found on page", Recipe));
          } else {
            resolve(Recipe);
          }
        } else {
          console.log("SERVER RESPONSE: ", response.statusCode)
          reject(new Error("Server error"));
        }
      });
    }
  });
};

delish("https://www.delish.com/cooking/recipe-ideas/a29786303/risotto-rice-recipe/");

module.exports = delish;
