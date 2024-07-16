import { initializeApp } from 'firebase/app';
import { getAuth, OAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBHGY-tOAE8Jf2bh2h5R3p1IiiY77c9dMU",
    authDomain: "webrtc-32540.firebaseapp.com",
    projectId: "webrtc-32540",
    storageBucket: "webrtc-32540.appspot.com",
    messagingSenderId: "838829777769",
    appId: "1:838829777769:web:77a3b81430dfb9f60c13f8",
    measurementId: "G-LVBQSC07HM"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);

export const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.setCustomParameters({
    prompt: 'select_account'
});