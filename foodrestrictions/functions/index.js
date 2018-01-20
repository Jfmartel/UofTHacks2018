'use strict';
//import checkFoodCategory from "./checkFoodCategory.js";

const functions = require('firebase-functions');
const DialogflowApp = require('actions-on-google').DialogflowApp;
const Food = require('./food');

function delay(t, v) {
   return new Promise(function(resolve) {
       setTimeout(resolve.bind(null, v), t)
   });
}

function sampleFoodApi(){
		return Food.getFoodItemUpc('kelloggs rice krispies squares').then(function(upc){
			return delay(1000).then(function() {
				return Food.getUpcIngredients(upc).then(function(ingr){
					return Food.checkIngredients(ingr, ['gelatin'])
				})
			})
		})
}

function containsRestrictedIngredients (food, restricted_ingredients) {

    /*return Food.getFoodItemUpc(food).then(function(upc){
        setTimeout(function() {
            Food.getUpcIngredients(upc).then(function(ingr){
                return Food.checkIngredients(ingr, restricted_ingredients)
            })
        }, 1000)
    })*/

    return Food.getFoodItemUpc(food).then(function(upc){
        return delay(1000).then(function() {
            return Food.getUpcIngredients(upc).then(function(ingr){
                return Food.checkIngredients(ingr, restricted_ingredients)
            })
        })
    })
}

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    console.log('Request headers: ' + JSON.stringify(request.headers));
    console.log('Request body: ' + JSON.stringify(request.body));

    const app = new DialogflowApp({request: request, response: response});
    const WELCOME_INTENT = 'input.welcome';

    // check if food falls under category (such as vegetarian)
    const CHECK_FOOD_CAT = "check_food_cat";

    // check if food contains ingredient
    const CHECK_FOOD_CONTAINS = "check_food_contains";

    const CHECK_FOOD_INEDIBLE = "check_food_inedible";
    const ERASE_PREFERENCES = "erase_preference";
    const SET_FOOD_CATEGORY = "set_food_category";
    const SET_FOOD_INEDIBLE = "set_food_inedible";

    function welcomeIntent (app) {
        app.ask('Welcome to food restrictions. Which foods are you unable to eat?',
            ['What ingredients are you allergic to?', 'What are you allergic to?', 'We can stop here. See you soon.']);
    }

    function addIndividualRestriction (app) {
        const ingredient = app.getArgument('ingredient');

        if (app.userStorage.restrictions) {
            app.userStorage.restrictions.push(ingredient);
        }
        else {
            app.userStorage.restrictions = [ingredient];
        }

        app.ask('Ok, I will add ' + ingredient + ' to your list of restricted ingredients. Is there anything else I can do?',
            ['Anything else I can help with?', 'Hey, what else can I do for you?', 'We can talk later']);

    }

    function addLifestyleRestrictions (app) {

        const lifestyle = app.getArgument('food_category');

        // for now, only one lifestyle (vegetarian, vegan)? Is there any reason to store more than one?
        app.userStorage.lifestyle = lifestyle;

        app.ask('Ok, I will remember that you are ' + lifestyle + '. What else can I help you with?',
            ['Anything else I can help with?', 'Hey, what else can I do for you?', 'We can talk later']);

    }

    function checkIfFoodRestricted (app) {
        const food = app.getArgument('food');
        let restricted_ingredients = app.userStorage.restrictions;
        const lifestyle = app.userStorage.lifestyle;

        if (lifestyle) {
            if (restricted_ingredients) {
                restricted_ingredients.push(lifestyle);
            }

            else {
                restricted_ingredients = [lifestyle]
            }
        }

        if (restricted_ingredients) {
            if (containsRestrictedIngredients(food, restricted_ingredients)) {
                app.ask(food + ' contains ingredients you cannot eat. What else can I help you with?',
                    ['Anything else I can help with?', 'Hey, what else can I do for you?', 'We can talk later']);
            }
        }

        app.ask(food + ' does not contain any ingredients you should worry about. What else can I help you with?',
            ['Anything else I can help with?', 'Hey, what else can I do for you?', 'We can talk later']);
    }

    function checkFoodConformsToLifestyle(app) {

        const food = app.getArgument('food');
        const lifestyle = app.getArgument('food_category');

        if (containsRestrictedIngredients(food, [lifestyle])) {
            app.ask(food + ' is not ' + lifestyle + '. What else can I help you with?',
                ['Anything else I can help with?', 'Hey, what else can I do for you?', 'We can talk later']);
        }

        app.ask(food + ' is ' + lifestyle + '. What else can I help you with?',
            ['Anything else I can help with?', 'Hey, what else can I do for you?', 'We can talk later']);
    }

    function checkFoodContainsIngredient(app) {

        const food = app.getArgument('food');
        const ingredient = app.getArgument('ingredient');
        const ingredients = retrieveFoodIngredients(food);

        if (ingredients.contains(ingredient)) {
            app.tell("Yes, " + food + " contains " + ingredient);
        }

        else {
            app.tell("No, " + food + "does not contain " + ingredient);

        }
    }

    function erasePreferences(app) {
        app.userStorage.lifestyle = null;
        app.userStorage.restrictions = null;

        app.ask("Your preferences have been erased. Anything else I can do for you?");
    }

    const actionMap = new Map();
    actionMap.set(WELCOME_INTENT, welcomeIntent);
    actionMap.set(SET_FOOD_INEDIBLE, addIndividualRestriction);
    actionMap.set(CHECK_FOOD_INEDIBLE, checkIfFoodRestricted);
    actionMap.set(SET_FOOD_CATEGORY, addLifestyleRestrictions);
    actionMap.set(ERASE_PREFERENCES, erasePreferences);
    actionMap.set(CHECK_FOOD_CONTAINS, checkFoodContainsIngredient);
    actionMap.set(CHECK_FOOD_CAT, checkFoodConformsToLifestyle);
    app.handleRequest(actionMap);

});

