const fetch = require('node-fetch');

function constructUri(baseUrl, args) {
  var apiArgs = {
    'api_key':'k5xhrkhwq7czbr9g8uzdca7c',
    'sid': '3e1fec7c-7dba-4b43-bd7a-969cec446308',
    'f': 'json'
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
    'n': 1,
    's': 0
  }

  return fetch(constructUri("http://api.foodessentials.com/searchprods", uriArgs),
  {
      method: "POST",
      data: ''
  })
  .then(function(response){ return response.json(); })
  .then(function(data){
    return (data.numFound > 0) ? data.productsArray[0].upc : null;
  })
}

function getUpcIngredients(upc) {

  var uriArgs = {
    'u': upc,
    'n': 1,
    's': 0
  }

  return fetch(constructUri("http://api.foodessentials.com/labelarray", uriArgs),
  {
      method: "POST",
      data: ''
  })
  .then(function(response){ return response.json(); })
  .then(function(data){
    return (data.numFound > 0) ? data.productsArray[0].ingredients.split(',')
      .map(function(i) {
        return i.toLowerCase().trim()
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
  var restrictionsMaster = {
    'vegan' : {
      'restrictions' : ['milk', 'eggs', 'beef', 'gelatin'],
      'exceptions' : ['soy milk', 'google']
    }
  }
  if (ingredient.includes(myRestriction)) { //restriction matches simple ingredient
    return false
  }
  else if (!Object.keys(restrictionsMaster).some(function(r) { return r === myRestriction })){ //restriction category not found?
    return true
  }
  else{
    console.log(ingredient)
    console.log(restrictionsMaster[myRestriction].exceptions.includes(ingredient))
    return !restrictionsMaster[myRestriction].restrictions.includes(ingredient) ||
           restrictionsMaster[myRestriction].exceptions.includes(ingredient)
  }
}

module.exports = {getFoodItemUpc, getUpcIngredients, checkIngredients}
