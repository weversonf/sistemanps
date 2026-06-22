const firebaseConfig = {
  apiKey: "AIzaSyDfIDkJy2k8RcBjXWq34HvG6U3bqMmKLAE",
  authDomain: "painel-nps-8a5bc.firebaseapp.com",
  projectId: "painel-nps-8a5bc",
  storageBucket: "painel-nps-8a5bc.firebasestorage.app",
  messagingSenderId: "145229215355",
  appId: "1:145229215355:web:06f94d86600f7e05e77f17"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
