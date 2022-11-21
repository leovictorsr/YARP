const cheerio = require("cheerio");
const puppeteerFetch = require("../helpers/puppeteerFetch");
const RecipeSchema = require("../helpers/recipe-schema");

const averieCooks = url => {
  return new Promise(async (resolve, reject) => {
    if (!url.includes("averiecooks.com")) {
      reject(new Error("url provided must include 'averiecooks.com'"));
    } else {
      try {
        const html = await puppeteerFetch(url);
        const Recipe = new RecipeSchema();
        const $ = cheerio.load(html);

        Recipe.name = $("meta[property='og:title']").attr("content");
        Recipe.image = $("meta[property='og:image']").attr("content");

        $("div.mv-create-ingredients")
          .children("li")
          .each((i, el) => {
            Recipe.ingredients.push(
              $(el)
                .text()
                .trim()
                .replace(/\s\s+/g, " ")
            );
          });

        $("div.mv-create-instructions")
          .find("li")
          .each((i, el) => {
            Recipe.instructions.push($(el).text());
          });


        Recipe.time.prep = $(".mv-create-time-prep").text();
        Recipe.time.cook = $(".mv-create-time-active").text();
        Recipe.time.total = $(".mv-create-time-total").text();

        if (!Recipe.name || !Recipe.ingredients.length) {
          reject(new Error("No recipe found on page"));
        } else {
          resolve(Recipe);
        }
      } catch (error) {
        reject(new Error("No recipe found on page"));
      }
    }
  });
};;

averieCooks("https://www.averiecooks.com/chicken-pad-thai").then(Recipe => console.log(Recipe));

module.exports = averieCooks;
