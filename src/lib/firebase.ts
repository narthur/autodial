import firebase from "firebase/app";
import "firebase/analytics";
import "firebase/auth";

let didInit = false;

export function init(): void {
  if (didInit) return;

  didInit = true;

  const firebaseConfig = {
    apiKey: "AIzaSyAmjMfBI8SKml08sawogayLIlq_sxILvBs",
    authDomain: "autodial-dfeb8.firebaseapp.com",
    projectId: "autodial-dfeb8",
    storageBucket: "autodial-dfeb8.appspot.com",
    messagingSenderId: "657180565382",
    appId: "1:657180565382:web:784ed37c5f7c1a9a3d9607",
    measurementId: "G-7G6DCYT41H",
  };

  firebase.initializeApp(firebaseConfig);
  firebase.analytics();
}
