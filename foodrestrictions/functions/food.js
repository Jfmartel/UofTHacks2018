const fetch = require('node-fetch');

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
  return fetch(constructUri("https://api.nal.usda.gov/ndb/search/", uriArgs),
  {
      method: "POST",
      data: ''
  })
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
  return fetch(constructUri("https://api.nal.usda.gov/ndb/V2/reports", uriArgs),
  {
      method: "POST",
      data: ''
  })
  .then(function(response){ return response.json(); })
  .then(function(data){
    return (data.count > 0) ? data.foods[0].food.ing.desc.split(',')
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
  console.log(ingredients)
  return restrictions.every(function(restriction) {         //for each restriction
    return ingredients.every(function(ingredient) {           //check if any ingredient breaks restriction
      return isIngredientAllowed(restriction, ingredient);
    })
  })
}

function isIngredientAllowed(myRestriction, ingredient) {
  var restrictionsMaster = {
    'vegan' : {
      'restrictions' : ['milk', 'eggs', 'beef'],
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
    return !restrictionsMaster[myRestriction].restrictions.includes(ingredient) ||
           restrictionsMaster[myRestriction].exceptions.includes(ingredient)
  }
}

module.exports = {getFoodItemUpc, getUpcIngredients, checkIngredients}
