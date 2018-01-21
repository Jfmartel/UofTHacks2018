let fetch = require('node-fetch');
const FoodRestrictions = require('./food_restrictions.json')
var Ingredients = require('./ingredients/ingredients.json')

function constructUri(baseUrl, args) {
  var apiArgs = {
    'api_key':'vvNxeLawkFLOkRRKyJgEnJQSgZhgGXlCiAI7CPBj',
    'format': 'json'
  }

  var url = baseUrl + '?'
  var arg
  var uriArgs = Object.assign(apiArgs, args)
  for (var key in uriArgs) {
     if (uriArgs.hasOwnProperty(key)) {
       arg = key + '=' + uriArgs[key] + '&'
       url += arg
     }
  }

  return url.slice(0, -1); // to remove final '&' symbol
}

function getFoodItemUpc(foodName) {

  var uriArgs = {
    'q': foodName.replace(/ /g, '+'),
    'max': 10,
    'sort': 'r'
  }
  return fetch(constructUri('https://api.nal.usda.gov/ndb/search', uriArgs))
  .then(function(response){ return response.json(); })
  .then(function(data){
    return (!!data.list) ? data.list.item[0].ndbno : null;
  })
}

function getUpcIngredients(upc) {

  var uriArgs = {
    'ndbno': upc,
    'type': 'f'
  }
  return fetch(constructUri('https://api.nal.usda.gov/ndb/V2/reports', uriArgs))
  .then(function(response){ return response.json(); })
  .then(function(data){
    console.log(data.foods[0].food)
    return (data.count > 0 && data.foods[0].food.ing) ? data.foods[0].food.ing.desc.split(',')
      .map(function(i) {
        return i.toLowerCase().trim();
      })
    : null;
  })

  //'SUGAR; WHEAT FLOUR; SKIM MILK; COCOA BUTTER; CHOCOLATE; PALM KERNEL OIL; MILK FAT; LACTOSE (MILK); \
  //CONTAINS 2% OR LESS OF: LECITHIN (SOY); PGPR; VANILLIN, ARTIFICIAL FLAVOR; SALT; YEAST; BAKING SODA.'
}

function checkIngredients(ingredients, restrictions) {
  //categories: vegetarian -> resictions + exceptions
            //or: an ingredient ( if not found?)
  //Restrictions is a list of categories / items?
  //Ingredients list is a string (as returned by getUpcIngredients), or is it massaged into a list before?
  return restrictions.every(function(restriction) {         //for each restriction
    return ingredients.every(function(ingredient) {           //check if any ingredient breaks restriction
      return isIngredientAllowed(restriction, ingredient);
    })
  })
}

function isIngredientAllowed(myRestriction, ingredient) {
  if (ingredient.includes(myRestriction)) { //restriction matches simple ingredient
    return false
  }
  else if (!Object.keys(FoodRestrictions).some(function(r) { return r === myRestriction })){ //restriction category not found?
    return true
  }
  else{
    return checkAgainstRestriction(myRestriction, ingredient);
  }
}

function checkAgainstRestriction(myRestriction, ingredient) {
  if (FoodRestrictions[myRestriction].exceptions.includes(ingredient)) {
    return true
  }
  for (var item of FoodRestrictions[myRestriction].restrictions){
    if (!isNaN(item))  {
      if (Ingredients[item].includes(ingredient)){
        return false
      }
    }
    else {
      if (item == ingredient){
        return false
      }
    }
  }
  return true
}

module.exports = {getFoodItemUpc, getUpcIngredients, checkIngredients}
