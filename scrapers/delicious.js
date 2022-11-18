const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const RecipeSchema = require("../helpers/recipe-schema");

const blockedResourceTypes = [
  "image",
  "media",
  "font",
  "texttrack",
  "object",
  "beacon",
  "csp_report",
  "imageset",
  "stylesheet",
  "font"
];

const skippedResources = [
  "quantserve",
  "adzerk",
  "doubleclick",
  "adition",
  "exelator",
  "sharethrough",
  "cdn.api.twitter",
  "google-analytics",
  "googletagmanager",
  "google",
  "fontawesome",
  "facebook",
  "analytics",
  "optimizely",
  "clicktale",
  "mixpanel",
  "zedo",
  "clicksor",
  "tiqcdn"
];

const customPuppeteerFetch = async url => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setRequestInterception(true);

  page.on("request", req => {
    const requestUrl = req._url.split("?")[0].split("#")[0];
    if (
      blockedResourceTypes.indexOf(req.resourceType()) !== -1 ||
      skippedResources.some(resource => requestUrl.indexOf(resource) !== -1)
    ) {
      req.abort();
    } else {
      req.continue();
    }
  });
  try {
    const response = await page.goto(url);
    if (response._status < 400) {
        let html = await page.content();
        await browser.close();
        return html;
    } else {
      await brower.close();
      return Promise.reject(response._status);
    }
  } catch (e) {
    await browser.close();
    return Promise.reject("invalid url");
  }
};

const delicious = url => {
  return new Promise(async (resolve, reject) => {
    if (!url.includes("delicious.com.au/recipes/")) {
      reject(new Error("url provided must include 'delicious.com.au/recipes/'"));
    } else {
      try {
        const html = await customPuppeteerFetch(url);
        const Recipe = new RecipeSchema();
        const $ = cheerio.load(html);

        Recipe.image = $("meta[property='og:image']").attr("content");
        Recipe.name = $("title").text().split("-")[0].trim();

        $("ul.ingredient").find("li").each((i, el) => {
          Recipe.ingredients.push($(el).text().replace("\n", "").trim());
        });

        $("ul.method").find("li.row").find(".step-description").each((i, el) => {
          Recipe.instructions.push($(el).text().replace("\n", "").replace(/\s\s+/g, "").trim());
        });

        $(".cooking-info-box").each((i, el) => {
          const label = $(el).find(".header").text();
          const value = $(el).find(".text").text();

          if (label.includes("serves")) Recipe.servings = value.trim();
          else if (label.includes("Prep")) Recipe.time.prep = value.trim();
          else if (label.includes("Cook")) Recipe.time.cook = value.trim();
        });

        if (!Recipe.name || !Recipe.ingredients.length || !Recipe.instructions.length) {
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

module.exports = delicious;
