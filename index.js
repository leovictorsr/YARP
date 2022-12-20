var express = require("express");
var bodyParser = require('body-parser')
var app = express();
const parseDomain = require("parse-domain");
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
const parse_ingredient = require('./ingr_parser/nlp_parser').parse;
var juration = require('juration');

const LANGUAGE = 'eng';
const groupRegex = /^\w+\:/gi;

const cleanup = (i) => {
    const cleanedIngredient = i.replace("–", "-").replace(' /', '/').toLowerCase();
    return cleanedIngredient;
};

const domains = {
  "101cookbooks": require("./scrapers/101cookbooks"),
  alexandracooks: require("./scrapers/alexandracooks"),
  allrecipes: require("./scrapers/allrecipes"),
  bettycrocker: require("./scrapers/bettycrocker"),
  chowhound: require("./scrapers/chowhound"),
  delish: require("./scrapers/delish"),
  jamieoliver: require("./scrapers/jamieoliver"),
  ambitiouskitchen: require("./scrapers/ambitiouskitchen"),
  archanaskitchen: require("./scrapers/archanaskitchen"),
  averiecooks: require("./scrapers/averiecooks"),
  bbc: require("./scrapers/bbc"),
  bbcgoodfood: require("./scrapers/bbcgoodfood"),
  bonappetit: require("./scrapers/bonappetit"),
  budgetbytes: require("./scrapers/budgetbytes"),
  centraltexasfoodbank: require("./scrapers/centraltexasfoodbank"),
  closetcooking: require("./scrapers/closetcooking"),
  cookieandkate: require("./scrapers/cookieandkate"),
  copykat: require("./scrapers/copykat"),
  damndelicious: require("./scrapers/damndelicious"),
  eatingwell: require("./scrapers/eatingwell"),
  epicurious: require("./scrapers/epicurious"),
  finecooking: require("./scrapers/finecooking"),
  food: require("./scrapers/food"),
  foodandwine: require("./scrapers/foodandwine"),
  foodnetwork: require("./scrapers/foodnetwork"),
  gimmesomeoven: require("./scrapers/gimmesomeoven"),
  kitchenstories: require("./scrapers/kitchenstories"),
  maangchi: require("./scrapers/maangchi"),
  minimalistbaker: require("./scrapers/minimalistbaker"),
  myrecipes: require("./scrapers/myrecipes"),
  nigella: require("./scrapers/nigella"),
  nomnompaleo: require("./scrapers/nomnompaleo"),
  omnivorescookbook: require("./scrapers/omnivorescookbook"),
  saveur: require("./scrapers/saveur"),
  seriouseats: require("./scrapers/seriouseats"),
  simplyrecipes: require("./scrapers/simplyrecipes"),
  smittenkitchen: require("./scrapers/smittenkitchen"),
  tastecooking: require("./scrapers/tastecooking"),
  thepioneerwoman: require("./scrapers/thepioneerwoman"),
  therealfoodrds: require("./scrapers/therealfoodrds"),
  thespruceeats: require("./scrapers/thespruceeats"),
  thewoksoflife: require("./scrapers/thewoksoflife"),
  vegrecipesofindia: require("./scrapers/vegrecipesofindia"),
  whatsgabycooking: require("./scrapers/whatsgabycooking"),
  woolworths: require("./scrapers/woolworths"),
  yummly: require("./scrapers/yummly"),
  thekitchn: require("./scrapers/thekitchn"),
  rachaelray: require("./scrapers/rachaelray"),
  rachaelrayshow: require("./scrapers/rachaelrayshow"),
  tablespoon: require("./scrapers/tablespoon"),
  sallysbakingaddiction: require("./scrapers/sallysbakingaddiction"),
  tasteofhome: require("./scrapers/tasteofhome"),
  jsonLd: require("./scrapers/jsonLd")
};

app.get("/parse", (req, res) => {
  if ("recipe" in req.query) {
    let recipe = req.query.recipe.split(/\r?\n/);
    let recipeParsed = tagger.tag(recipe);
    res.send({
      recipeParsed: recipeParsed,
    });
  } else {
    return res.status("400").send({
      message: "Request must send a parameter \"recipe\".",
    });
  }
});

const recipeScraper = url => {
  return new Promise((resolve, reject) => {
    let parse = parseDomain(url);
    if (parse) {
      let domain = parse.domain;
      if (domains[domain] !== undefined) {
        resolve(domains[domain](url));
      } else {
        resolve(domains["jsonLd"](url));
        console.log("Recipe Site not yet supported :" + url);
        reject(new Error("Recipe Site not yet supported"));
      }
    } else {
      console.log("Failed to parse Recipe on the website :" + url);
      reject(new Error("Failed to parse Recipe on the website"));
    }
  });
};

module.exports = recipeScraper;

app.get('/parseRecipeOnCloud', async function (req, res, next) {
  var url = req.query.url
  console.log("Recipe URL Received is :" + url);
  recipeScraper(url)
    .then(recipe => {
      console.log("\nRecipe Scraped, JSON is :%j", recipe);
      recipe.url = url;
      const ingrParserResult = recipe.ingredients.map((v, i) => parse_ingredient(v, LANGUAGE));
      let parsedIngredients = [];
      for (i = 0; i < ingrParserResult.length; i++) {
        const ingredient = ingrParserResult[i];
        parsedIngredients.push(ingredient);
      }
      recipe.ingredients = parsedIngredients;
      if (recipe["servings"] != null && recipe["servings"].length > 0) {
        recipe["servingsOriginal"] = recipe["servings"];
        recipe["servings"] = getFirstNumber(recipe["servings"]);
      }
      if (recipe["instructions"] != null && recipe["instructions"].length > 0) {
        recipe["instructions"] = recipe["instructions"].filter(function (el) {
          return el != null && el.length > 0 && el.trim().length > 0;
        });
      }
      if (recipe["time"]["prep"].length > 0) {
        try {
          var prepTimeSeconds = juration.parse(recipe["time"]["prep"]);
          if (prepTimeSeconds != null) {
            recipe["time"]["prepTimeSeconds"] = prepTimeSeconds;
          }
        }
        catch (err) {
          console.log("Exception caught parsing prep time :" + recipe["time"]["prep"] + ", exception is :" + err);
        }
      }
      if (recipe["time"]["cook"].length > 0) {
        try {
          var cookTimeSeconds = juration.parse(recipe["time"]["cook"]);
          if (cookTimeSeconds != null) {
            recipe["time"]["cookTimeSeconds"] = cookTimeSeconds;
          }
        }
        catch (err) {
          console.log("Exception caught parsing cook time :" + recipe["time"]["cook"] + ", exception is :" + err);
        }
      }
      if (recipe["time"]["total"].length > 0) {
        try {
          var totalTimeSeconds = juration.parse(recipe["time"]["total"]);
          if (totalTimeSeconds != null) {
            recipe["time"]["totalTimeSeconds"] = totalTimeSeconds;
          }
        }
        catch (err) {
          console.log("Exception caught parsing total time :" + recipe["time"]["total"] + ", exception is :" + err);
        }
      }
      console.log("\n\nReturning Recipe in a custom format to App :%j", recipe);
      res.status(200).send(recipe);
    }).catch(function (error) {
      console.log("Exception caught processing Recipe :" + error);
      res.status(561).send(error);
    });
});

app.get('/parseIngredients', (req, res) => {
  const { ingredients } = req.body;
  let parsedIngredients = [];
  let group = [];
  let currentGroup = "";
  if (Array.isArray(ingredients)) {
      const hasGroup = ingredients.reduce((prev, curr) => prev || curr.match(groupRegex), false);
      for (let i of ingredients) {
          let parsedIngredient = parse_ingredient(cleanup(i), LANGUAGE);

          if (!hasGroup) {
              parsedIngredients.push(parsedIngredient);
          }
          else if (hasGroup && i.match(groupRegex)) {
              currentGroup = i.match(groupRegex)[0].replace(":", "").trim();
              if (group.length) {
                  parsedIngredients.push(group);
                  group = [];
              }
          }
          else if (hasGroup) {
              parsedIngredient.group = currentGroup;
              group.push(parsedIngredient);
          }
      }

      if (group.length) parsedIngredients.push(group);
  }

  res.send(parsedIngredients);
});

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getFirstNumber(string) {
  // console.log("Getting Serving Size, string is :" + string);
  var r = /\d+/;

  return string.match(r);
}

app.listen(3101, function () {
  console.log('Recipe and Ingredient Parser app started on port 3101')
});