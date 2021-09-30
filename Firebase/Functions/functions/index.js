const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

var express = require("express");
var app = express();

app.get("/:id", function (req, res) {
  res.send("The entered id is " + req.params.id);
});

//Route handler
app.get("/", function (req, res) {
  var random = Math.floor(Math.random() * 1000000) + 1;
  res.send(String(random));
});


exports.app = functions.https.onRequest(app);