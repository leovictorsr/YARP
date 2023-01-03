function Recipe() {
  this.name = "";
  this.defaultFlag = false;
  this.ingredients = [];
  this.instructions = [];
  this.time = {
    prep: "",
    prepTimeSeconds: 0,
    cook: "",
    cookTimeSeconds: 0,
    active: "",
    inactive: "",
    ready: "",
    total: "",
    totalTimeSeconds: 0,
  };
  this.servings = 0;
  this.servingsOriginal = "";
  this.image = "";
  this.url = "";
  this.nutrition = [];
  this.category = "";
  this.cuisine = "";
  this.keywords = [];
}

module.exports = Recipe;
