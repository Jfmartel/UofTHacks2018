'use strict';
//import checkFoodCategory from "./checkFoodCategory.js";

const functions = require('firebase-functions');
const DialogflowApp = require('actions-on-google').DialogflowApp;
const Food = require('./food');
const Ingredients = require('./ingredients/ingredients.json');

function delay(t, v) {
   return new Promise(function(resolve) {
       setTimeout(resolve.bind(null, v), t)
   });
}


function sampleFoodApi(){
		return Food.getFoodItemUpc('teriyaki sauce').then(function(upc){
			return delay(1000).then(function() {
				return Food.getUpcIngredients(upc).then(function(ingr){
					return Food.checkIngredients(ingr, ['vegetarian'])
				})
			})
		})
}

function isBasicIngredient(food) {
  for (var category in Ingredients) {
    if (Ingredients.hasOwnProperty(category)) {
      if (Ingredients[category].includes(food)){
        return true
      }
    }
  }
  return false
}

function containsRestrictedIngredients (food, restricted_ingredients) {
  if (isBasicIngredient(food)) {
    return Promise.resolve(Food.checkIngredients([food], restricted_ingredients))
  }
  else{
    return Food.getFoodItemUpc(food).then(function(upc){
      if(!upc){
        return Promise.resolve(null);
      }
      else {
        return Food.getUpcIngredients(upc).then(function(ingr){
            return Food.checkIngredients(ingr, restricted_ingredients)
        })
      }
    })
  }
}

//Good -> Basic food
// containsRestrictedIngredients('carrots', ['peanuts']).then(function(res){
//     console.log("result:" + res);
// })

//Good -> complex food
// containsRestrictedIngredients('kelloggs rice krispies cereal', ['vegetarian']).then(function(res){
//     console.log("result:" + res);
// })

//Bad -> no results
containsRestrictedIngredients('sjkhfjfdghdkf//', ['peanuts']).then(function(res){
    console.log("result:" + res);
})

//Bad -> basic restricted ingredient
// containsRestrictedIngredients('gelatin', ['vegetarian']).then(function(res){
//     console.log("result:" + res);
// })

//Bad -> complex restricted ingredient
containsRestrictedIngredients('coca cola drink', ['broccoli']).then(function(res){
    console.log("result:" + res);
})

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    console.log('Request headers: ' + JSON.stringify(request.headers));
    console.log('Request body: ' + JSON.stringify(request.body));

    const app = new DialogflowApp({request: request, response: response});
    const actionMap = new Map();

    // WELCOME INTENT
    actionMap.set('input.welcome', function welcomeIntent (app) {
        app.ask('Welcome to food restrictions. Ask me about whether food contains certain ingredients, or set your dietary restrictions so I can watch out for them.',
            ['What ingredients are you allergic to?', 'What are you allergic to?', 'We can stop here. See you soon.']);
    });


    // SET ALLERGY/RESTRICTED ITEM
    actionMap.set('set_food_inedible', function addIndividualRestriction (app) {
        const ingredient = app.getArgument('ingredient');

        // If restrictions is null, create an empty list
        if(!app.userStorage.restrictions){
            app.userStorage.restrictions = [];
        }

        // Then handle case
        if (!app.userStorage.restrictions.includes(ingredient)) {
            app.userStorage.restrictions.push(ingredient);
            app.ask('Ok, I will add ' + ingredient + ' to your list of restricted ingredients. Is there anything else I can do?',
            ['Anything else I can help with?', 'Hey, what else can I do for you?', 'We can talk later']);
        }
        else{
            app.ask('It looks like ' + ingredient + ' is already on your list of restricted ingredients. Is there anything else I can do?',
            ['Anything else I can help with?', 'Hey, what else can I do for you?', 'We can talk later']);
        }



    });

    // CHECK IF FOOD IS RESTRICTED
    actionMap.set('check_food_inedible', function checkIfFoodRestricted (app) {
        const food = app.getArgument('food');
        let restricted_ingredients = app.userStorage.restrictions;
        const lifestyle = app.userStorage.lifestyle;
        let copiedList = [];
        if (lifestyle) {
            if (restricted_ingredients) {

                copiedList = [...restricted_ingredients];
                copiedList.push(lifestyle);
            }

            else {
                copiedList.push(lifestyle);
            }
        }
        if (copiedList) {
            containsRestrictedIngredients(food, copiedList).then(function(ans){
                if (ans === null){
                    app.ask("I'm sorry, I couldn't seem to find " + food + ". Is there anything else I can check for you?",
                        ['Anything else I can help with?', 'Hey, what else can I do for you?', 'We can talk later']);

                }
                else if (!ans){
                    app.ask("No, " + food + ' contains ingredients you cannot eat. What else can I help you with?',
                        ['Anything else I can help with?', 'Hey, what else can I do for you?', 'We can talk later']);
                }
                else{
                    app.ask("Yes, " + food + ' does not contain any ingredients you should worry about. What else can I help you with?',
                        ['Anything else I can help with?', 'Hey, what else can I do for you?', 'We can talk later']);
                }
            })

        }
        else{
        app.ask("Yes, " + food + ' does not contain any ingredients you should worry about. What else can I help you with?',
            ['Anything else I can help with?', 'Hey, what else can I do for you?', 'We can talk later']);
        }

    });

    // SET LIFESTYLE (VEGAN, VEGETARIAN)
    actionMap.set('set_food_category', function addLifestyleRestrictions (app) {

            const lifestyle = app.getArgument('food_category');

            // for now, only one lifestyle (vegetarian, vegan)? Is there any reason to store more than one?
            app.userStorage.lifestyle = lifestyle;

            // Religious cases
            if(lifestyle == "halal"){
               app.ask('Ok, I will remember that you eat ' + lifestyle + ' food. What else can I help you with?',
                ['Anything else I can help with?', 'Hey, what else can I do for you?', 'We can talk later']);
            }
            else{
                app.ask('Ok, I will remember that you are ' + lifestyle + '. What else can I help you with?',
                ['Anything else I can help with?', 'Hey, what else can I do for you?', 'We can talk later']);
            }
        }
    );

    // ERASE SAVED RESTRICTIONS / LIFESTYLE
    actionMap.set('erase_preferences',  function erasePreferences(app) {
        app.userStorage.lifestyle = null;
        app.userStorage.restrictions = null;

        app.ask("Your preferences have been erased. Anything else I can do for you?");
    });


    // CHECK IF FOOD CONTAINS GIVEN INGREDIENT
    actionMap.set('check_food_contains_ingredient', function checkFoodContainsIngredient(app) {

        const food = app.getArgument('food');
        const ingredient = app.getArgument('ingredient');

        containsRestrictedIngredients(food, [ingredient]).then(function(ans){
          ans ?
          app.ask("No, " + food + "does not contain " + ingredient + ". Can I help you with something else?",
              ["Can I help you?", "What would you like to do?", "We can chat again later"]):
          app.ask("Yes, " + food + " contains " + ingredient + ". Can I help you with something else?",
              ["Can I help you?", "What would you like to do?", "We can chat again later"]);


        })
    });

    // CHECK FOOD DOESN'T VIOLATE LIFESTYLE
    actionMap.set('check_food_cat', function checkFoodConformsToLifestyle(app) {

        const food = app.getArgument('food');
        const lifestyle = app.getArgument('food_category');

        containsRestrictedIngredients(food, [lifestyle]).then(function(ans){
          ans ?
          app.ask(food + ' is ' + lifestyle + '. What else can I help you with?',
              ['Anything else I can help with?', 'Hey, what else can I do for you?', 'We can talk later']):
          app.ask(food + ' is not ' + lifestyle + '. What else can I help you with?',
              ['Anything else I can help with?', 'Hey, what else can I do for you?', 'We can talk later']);

        })
    });

    // CHECK DIETARY STORED LIFESTYLE
    actionMap.set('get_lifestyle', function checkDietaryLifestyle(app) {
        if(app.userStorage.lifestyle){
            app.ask('Your lifestyle diet is ' + app.userStorage.lifestyle + '. What else can I help you with?',
                ['Anything else I can help with?', 'Hey, what else can I do for you?', 'We can talk later']);
        }
        else{
            app.ask('You don\'t seem to have any lifestyle dietary restrictions. If you want to set one, you could say "I am vegan" and I will remember this for future use. What else can I help you with?',
                ['Anything else I can help with?', 'Hey, what else can I do for you?', 'We can talk later']);
        }
    });

    // CHECK STORED DIETARY RESTRICTIONS/PREFERENCES
    actionMap.set('get_preferences', function checkDietaryRestrictions(app) {

        let response = "You have not indicated any restrictions. If you would like you add one, you could say something like 'I am vegetarian' or 'I am allergic to peanuts' " +
        "and I will remember it for future interactions.";

        if (app.userStorage.lifestyle) {
            if(app.userStorage.lifestyle == "halal"){
                response = "You have indicated that you eat " + app.userStorage.lifestyle + " food.";
            }
            else{
                response = "You have indicated that you are " + app.userStorage.lifestyle + ".";
            }

            if (app.userStorage.restrictions) {
                response = response + " Also, you have specified that you cannot eat";

               for (var restriction of app.userStorage.restrictions) {
                    if(app.userStorage.restrictions.indexOf(restriction) == app.userStorage.restrictions.length - 2){
                        response = response + " "  + restriction + " and";
                    }
                    else{
                        response = response + " "  + restriction + ",";
                    }
                }

                response = response.substring(0, response.length -1) + ".";
            }
        }

        if (app.userStorage.restrictions) {

            if(app.userStorage.lifestyle == "halal"){
                response = "You have indicated that you eat " + app.userStorage.lifestyle + " food.";
            }
            else if(!app.userStorage.lifestyle){
                response = "";
            }
            else{
                response = "You have indicated that you are " + app.userStorage.lifestyle + ".";
            }

            response = response + " Also, you have specified that you cannot eat";

           for (var restriction of app.userStorage.restrictions) {
                if(app.userStorage.restrictions.indexOf(restriction) == app.userStorage.restrictions.length - 2){
                    response = response + " "  + restriction + " and";
                }
                else{
                    response = response + " "  + restriction + ",";
                }
            }

            response = response.substring(0, response.length -1) + ".";
        }

        app.ask(response + " Is there anything else I can help you with?", ["Do you need any more help?", "Is there anything" +
        "I can do for you?", "We can talk later"]);

    });
    app.handleRequest(actionMap);

});
