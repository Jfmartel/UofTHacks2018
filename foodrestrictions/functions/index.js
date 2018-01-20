'use strict';

const functions = require('firebase-functions');
const DialogflowApp = require('actions-on-google').DialogflowApp;

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    console.log('Request headers: ' + JSON.stringify(request.headers));
    console.log('Request body: ' + JSON.stringify(request.body));

    const app = new DialogflowApp({request: request, response: response});
    const WELCOME_INTENT = 'input.welcome';
    const INGREDIENT_INTENT = 'input.ingredient';

    function welcomeIntent (app) {
        app.ask('Welcome to food restrictions. What allergies do you have?',
            ['What ingredients are you allergic to?', 'What are you allergic to?', 'We can stop here. See you soon.']);
    }

    function ingredientIntent (app) {
        const ingredient = app.getArgument('ingredName');
        app.tell('You said ' + ingredient);
    }

    const actionMap = new Map();
    actionMap.set(WELCOME_INTENT, welcomeIntent);
    actionMap.set(INGREDIENT_INTENT, ingredientIntent);
    app.handleRequest(actionMap);

})