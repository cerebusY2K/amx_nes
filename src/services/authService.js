import { auth, microsoftProvider, firestore } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const signInWithMicrosoft = async () => {
    const result = await signInWithPopup(auth, microsoftProvider);
    const user = result.user;
    const userDocRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
        await setDoc(userDocRef, { role: 'guest', email: user.email });
    }
    return result;
};

export const signOutUser = () => {
    return auth.signOut();
};
