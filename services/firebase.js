import firebase from "firebase/app";
// import "firebase/auth";
// import "firebase/analytics";
import "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  //   storageBucket: "webrtc-demo-36cbd.appspot.com",
  //   messagingSenderId: "169662115226",
  //   appId: "1:169662115226:web:ec9fe43a87576851885e23",
  //   measurementId: "G-2W9PMRMM32",
  // apiKey: "AIzaSyAmsL812O1L2a5vcXHf7-naDzUU24lbqx8",
  // authDomain: "webrtc-demo-36cbd.firebaseapp.com",
  // projectId: "webrtc-demo-36cbd",
  storageBucket: "webrtc-demo-36cbd.appspot.com",
  messagingSenderId: "169662115226",
  appId: "1:169662115226:web:ec9fe43a87576851885e23",
  measurementId: "G-2W9PMRMM32",
};

export default function initFirebase() {
  if (!firebase.apps.length) {
    firebase.initializeApp(config);
    // const firestore = firebase.firestore();
  }
}
// export firestore;
