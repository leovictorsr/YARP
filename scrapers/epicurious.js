const request = require("request");
const cheerio = require("cheerio");
const RecipeSchema = require("../helpers/recipe-schema");

const epicurious = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("epicurious.com/recipes/")) {
      reject(new Error("url provided must include 'epicurious.com/recipes/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $("meta[property='og:title']").attr("content")

          $("div[class*='Description']").each((i, el) => {
            Recipe.ingredients.push($(el).text());
          });

          $("li[class*='InstructionListWrapper']").each((i, el) => {
            $(el).find("p").each((i, el) => {
              Recipe.instructions.push($(el).text().replace(/\s\s+/g, ""))
            })
          });

          $("li[class*='InfoSliceListItem']").each((i, el) => {
            const value = $(el).first().children().first().children().last().text()
            if (i === 0) Recipe.time.active = value;
            if (i === 1) Recipe.time.total = value;
          });

          Recipe.servings = $("dd.yield").text();

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
        } else {
          reject(new Error("No recipe found on page"));
        }
      });
    }
  });
};

epicurious("https://www.epicurious.com/recipes/food/views/spatchcocked-turkey").then(recipe => console.log(recipe))

module.exports = epicurious;
