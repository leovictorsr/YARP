const request = require("request");
const cheerio = require("cheerio");

const RecipeSchema = require("../helpers/recipe-schema");

const chowhound = url => {
  const Recipe = new RecipeSchema();
  return new Promise((resolve, reject) => {
    if (!url.includes("chowhound.com/")) {
      reject(new Error("url provided must include 'chowhound.com/'"));
    } else {
      request(url, (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const $ = cheerio.load(html);

          Recipe.image = $("meta[property='og:image']").attr("content");
          Recipe.name = $("meta[property='og:title']").attr("content");

          $(".freyja_box81")
            .find("li")
            .each((i, el) => {
              Recipe.ingredients.push($(el).text());
            })

          $(".fr_instruction_rec")
            .find("li")
            .each((i, el) => {
              let text = $(el).text().replace(/[^a-zA-Z0-9 ]/g, "").trim().split("");
              text.shift();
              text = text.join("");
              Recipe.instructions.push(text);
            })

          let servings = $(".frr_serves.fr_sep").text()
          if (servings) {
            Recipe.servings = servings.toLowerCase()
          }

          let activeTime = $(".frr_totaltime.frr_active").find("time").first().text()
          if (activeTime) {
            Recipe.time.active = activeTime.trim();
          }

          let totalTime = $(".frr_totaltime").find("time").first().text()
          if (totalTime) {
            Recipe.time.total = totalTime.trim();
          }

          if (
            !Recipe.name ||
            !Recipe.ingredients.length) {
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

module.exports = chowhound;
