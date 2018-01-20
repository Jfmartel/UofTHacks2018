'use strict';
import checkFoodCategory from "./checkFoodCategory.js";

const functions = require('firebase-functions');
const DialogflowApp = require('actions-on-google').DialogflowApp;

function retrieveFoodIngredients (food) {
    // todo
}

function getLifestyleRestrictedIngredients (lifestyle) {
    // todo
}

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    console.log('Request headers: ' + JSON.stringify(request.headers));
    console.log('Request body: ' + JSON.stringify(request.body));

    const app = new DialogflowApp({request: request, response: response});
    const WELCOME_INTENT = 'input.welcome';
    // const RESTRICTION_INTENT = 'input.ingredient';

    // check if food falls under category (such as vegetarian)
    const CHECK_FOOD_CAT = "check_food_cat";

    // check if food contains ingredient
    const CHECK_FOOD_CONTAINS = "check_food_contains";

    const CHECK_FOOD_INEDIBLE = "check_food_inedible";
    const ERASE_PREFERENCES = "erase_preference";
    const SET_FOOD_CATEGORY = "set_food_category";
    const SET_FOOD_INEDIBLE = "input.inedible_ingredient";

    function welcomeIntent (app) {
        app.ask('Welcome to food restrictions! What allergies do you have?',
            ['What ingredients are you allergic to?', 'What are you allergic to?', 'We can stop here. See you soon.']);
    }

    function addIndividualRestriction (app) {
        const ingredient = app.getArgument('ingredient');

        if (app.userStorage.restrictions) {
            app.userStorage.restrictions.add(ingredient);
        }
        else {
            app.userStorage.restrictions = [];
            app.userStorage.restrictions.add(ingredient)
        }

        app.tell('Ok, I will add ' + ingredient + ' to your list of restricted ingredients');

    }

    function addLifestyleRestrictions (app) {

        const lifestyle = app.getArgument('food_category');
        app.tell('Ok, I will remember that you are ' + lifestyle);
        app.userStorage.lifestyle = lifestyle;
    }

    function checkIfFoodRestricted (app) {
        const food = app.getArgument('food');
        const ingredients = retrieveFoodIngredients(food);

        // look up this food and check if any restricted ingredients are in it.
        // should check lifestyle and individual ingredients
        // todo
    }

    function checkFoodConformsToLifestyle(app) {

        const food = app.getArgument('food');
        const lifestyle = app.getArgument('food_category');

        const lifeStyleRestricted = getLifestyleRestrictedIngredients(lifestyle);
        const foodIngredients = retrieveFoodIngredients(food);

        // check that none of foodIngredients is in lifeStyleRestricted
        // todo
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