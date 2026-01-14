import auth, { getAuth } from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';

// Use the modular API
export const firebaseAuth = getAuth(getApp());

export const sendOTP = async (phoneNumber: string) => {
  const confirmation = await firebaseAuth.signInWithPhoneNumber(phoneNumber);
  return confirmation;
};

export const verifyOTP = async (confirmation: any, code: string) => {
  const credential = await confirmation.confirm(code);
  return credential;
};

export const signOut = async () => {
  await firebaseAuth.signOut();
};

export const getCurrentUser = () => {
  return firebaseAuth.currentUser;
};

export const getIdToken = async () => {
  const user = firebaseAuth.currentUser;
  if (user) {
    // Use getIdToken as a method (modular API)
    return await user.getIdToken();
  }
  return null;
};
