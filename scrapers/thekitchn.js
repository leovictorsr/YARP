const request = require("request");
const cheerio = require("cheerio");

const RecipeSchema = require("../helpers/recipe-schema");

const thekitchn = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("thekitchn.com/")) {
      reject(new Error("url provided must include 'thekitchn.com/'"));
    } else {
      const options = {
        url,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36'
        }
      }
      request(options, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $("meta[name='title']").attr("content");

          $(".Recipe__ingredients")
            .find("li")
            .each((i, el) => {
              Recipe.ingredients.push($(el).text().replace(/\s\s+/g, " ").trim());
            });

          $(".Recipe__instructions")
            .find("li")
            .each((i, el) => {
              Recipe.instructions.push($(el).text().replace(/\s\s+/g, " ").trim());
            });

          let servings = $(".Recipe__yield").text().replace("Yield", "");
          if (servings) {
            Recipe.servings = servings.trim();
          }

          let time = $(".Recipe__timeEntry");

          let prepTime = $(time).first().text().replace("Prep time", "");
          if (prepTime) {
            Recipe.time.prep = prepTime.replace(/\s\s+/g, " ").replace("Bake", "").trim();
          }

          let cookTime = $($(time).get(1)).text().replace("Cook time", "");
          if (cookTime) {
            Recipe.time.cook = cookTime.replace(/\s\s+/g, " ").trim();
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

thekitchn("https://www.thekitchn.com/chicken-sweet-potato-noodle-bowls-recipe-23033871");

module.exports = thekitchn;
