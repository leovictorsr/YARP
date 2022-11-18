const cheerio = require("cheerio");

const RecipeSchema = require("../helpers/recipe-schema");
const puppeteerFetch = require("../helpers/puppeteerFetch");

const rachaelRay = url => {
    return new Promise(async (resolve, reject) => {
        if (!url.includes("rachaelrayshow.com/recipes")) {
            reject(new Error("url provided must include 'rachaelrayshow.com/recipes'"));
        } else {
            try {
                const html = await puppeteerFetch(url);
                const Recipe = new RecipeSchema();
                const $ = cheerio.load(html);

                Recipe.image = $("meta[property='og:image']").attr("content");
                Recipe.name = $("meta[name='title']").attr("content").replace(" | Rachael Ray", "");


                $("li[itemprop='ingredients']")
                    .each((i, el) => {
                        Recipe.ingredients.push($(el).text());
                    });

                $(".recipe-instructions")
                    .find("p")
                    .each((i, el) => {
                        Recipe.instructions.push($(el).text().trim());
                    });

                let servingsText = $(".yield-value").text();
                Recipe.servings = servingsText
                    .slice(servingsText.indexOf(":") + 1)
                    .trim();

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

module.exports = rachaelRay;