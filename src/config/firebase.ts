import auth from '@react-native-firebase/auth';

// Use the auth instance directly (React Native Firebase already provides the initialized instance)
export const firebaseAuth = auth();

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
