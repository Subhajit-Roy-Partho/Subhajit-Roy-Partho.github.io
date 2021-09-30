import * as firebase from 'firebase';
// import fetch from "node-fetch";
// const fetch = require('node-fetch');
var config ={
    apiKey: "AIzaSyBng_25mFjggDCj3kkkBnMxn_utahT3W0Q",
      authDomain: "edusite-cc257.firebaseapp.com",
      databaseURL: "https://edusite-cc257.firebaseio.com",
      projectId: "edusite-cc257",
      storageBucket: "edusite-cc257.appspot.com",
      messagingSenderId: "651286049339",
      appId: "1:651286049339:web:52d48123d9481aa00be21e",
      measurementId: "G-P4X2HGR51Z"

  };
  if (typeof window !== 'undefined') {
    firebase.initializeApp(config);
  }

  export default firebase;
