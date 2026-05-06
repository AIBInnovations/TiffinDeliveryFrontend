import AsyncStorage from '@react-native-async-storage/async-storage';

// Bump suffix (V2, V3...) when reintroducing a refreshed tour to existing users.
export const TOUR_SEEN_KEY = 'has_seen_customer_tour_V1';
export const TOUR_PENDING_KEY = 'customer_tour_pending_V1';

export const hasSeenTour = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(TOUR_SEEN_KEY);
    return value === 'true';
  } catch {
    return false;
  }
};

export const markTourSeen = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOUR_SEEN_KEY, 'true');
    await AsyncStorage.removeItem(TOUR_PENDING_KEY);
  } catch {
    // best-effort; if persistence fails the tour will simply re-show next launch
  }
};

export const markTourPending = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOUR_PENDING_KEY, 'true');
  } catch {
    // best-effort; the tour is non-critical UI
  }
};

export const isTourPending = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(TOUR_PENDING_KEY);
    return value === 'true';
  } catch {
    return false;
  }
};
