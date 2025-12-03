import auth from '@react-native-firebase/auth';

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
    return await user.getIdToken();
  }
  return null;
};
