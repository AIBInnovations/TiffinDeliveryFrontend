// src/screens/home/HomeScreen.tsx
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ScrollView,
  ImageSourcePropType,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { MainTabParamList } from '../../types/navigation';
import { useCart } from '../../context/CartContext';
import { useAddress } from '../../context/AddressContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useNotifications } from '../../context/NotificationContext';
import apiService, { KitchenInfo, MenuItem, AddonItem, extractKitchensFromResponse } from '../../services/api.service';
import dataPreloader from '../../services/dataPreloader.service';
import MealWindowModal from '../../components/MealWindowModal';
import { getMealWindowInfo as getWindowInfo, isMealWindowAvailable } from '../../utils/timeUtils';
import { formatNextAutoOrderTime } from '../../utils/autoOrderUtils';
import NotificationBell from '../../components/NotificationBell';
import { useResponsive, useScaling } from '../../hooks/useResponsive';
import { SPACING } from '../../constants/spacing';
import { FONT_SIZES } from '../../constants/typography';

type Props = StackScreenProps<MainTabParamList, 'Home'>;

type MealType = 'lunch' | 'dinner';

interface AddOn {
  id: string;
  name: string;
  image: ImageSourcePropType;
  quantity: string;
  price: number;
  selected: boolean;
  count: number;
}

interface MenuData {
  lunch?: MenuItem;
  dinner?: MenuItem;
  onDemandMenu: MenuItem[];
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const {
    cartItems,
    replaceCart,
    updateQuantity: updateCartItemQuantity,
    setKitchenId,
    setMenuType,
    setMealWindow,
    setDeliveryAddressId,
  } = useCart();
  const { getMainAddress, selectedAddressId, addresses, currentLocation, isGettingLocation } = useAddress();
  const { usableVouchers, subscriptions, fetchSubscriptions, fetchVouchers } = useSubscription();
  const { fetchUnreadCount, fetchNotifications } = useNotifications();
  const insets = useSafeAreaInsets();
  const { width, isSmallDevice } = useResponsive();
  const { scale } = useScaling();
  const [selectedMeal, setSelectedMeal] = useState<MealType>('lunch');
  const [showCartModal, setShowCartModal] = useState(false);
  const [mealQuantity, setMealQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Menu state
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [currentKitchen, setCurrentKitchen] = useState<KitchenInfo | null>(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [requiresAddress, setRequiresAddress] = useState(false);

  // Dynamic add-ons from API
  const [addOns, setAddOns] = useState<AddOn[]>([]);

  // Meal window modal state
  const [showMealWindowModal, setShowMealWindowModal] = useState(false);
  const [hasCheckedMealWindow, setHasCheckedMealWindow] = useState(false);

  // Auto-order notification state
  const [showAutoOrderNotification, setShowAutoOrderNotification] = useState(false);

  // Background data preload tracking
  const hasPreloadedRef = useRef(false);

  // Note: We no longer use fallback addons with fake IDs as they cause API validation errors
  // Addons must come from the API with valid MongoDB ObjectIds
  // If no addons are returned from API, we show an empty list

  // Get meal window info - HARDCODED based on time
  const mealWindowInfo = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();

    console.log('[HomeScreen] Calculating meal window info (HARDCODED)');
    console.log('[HomeScreen] Current time:', now.toLocaleString());
    console.log('[HomeScreen] Current hour:', currentHour);

    // HARDCODED LOGIC:
    // 6 AM (6:00) to 6 PM (18:00) = Lunch
    // 6 PM (18:00) to 6 AM (6:00) = Dinner
    if (currentHour >= 6 && currentHour < 18) {
      console.log('[HomeScreen] Time is between 6 AM and 6 PM -> Lunch');
      return {
        activeMeal: 'lunch' as MealType,
        isWindowOpen: true,
        nextMealWindow: 'lunch' as MealType,
        nextMealWindowTime: '6:00 AM',
      };
    } else {
      console.log('[HomeScreen] Time is between 6 PM and 6 AM -> Dinner');
      return {
        activeMeal: 'dinner' as MealType,
        isWindowOpen: true,
        nextMealWindow: 'dinner' as MealType,
        nextMealWindowTime: '6:00 PM',
      };
    }
  }, []);


  // Initialize meal tab based on current time and show modal if outside window
  useEffect(() => {
    if (!hasCheckedMealWindow) {
      const now = new Date();
      console.log('==================================================');
      console.log('[HomeScreen] TAB SELECTION INITIALIZATION');
      console.log('==================================================');
      console.log('[HomeScreen] Current time:', now.toLocaleString());
      console.log('[HomeScreen] Current hour:', now.getHours(), 'minute:', now.getMinutes());
      console.log('[HomeScreen] Kitchen:', currentKitchen?.name);
      console.log('[HomeScreen] Has operating hours:', !!currentKitchen?.operatingHours);
      console.log('[HomeScreen] Meal window info:', JSON.stringify(mealWindowInfo, null, 2));
      console.log('[HomeScreen] Selected meal will be:', mealWindowInfo.activeMeal);
      console.log('==================================================');

      // Set the initial meal based on current time
      setSelectedMeal(mealWindowInfo.activeMeal);
      console.log('[HomeScreen] Tab set to:', mealWindowInfo.activeMeal);

      // If outside meal window, show the modal
      if (!mealWindowInfo.isWindowOpen) {
        console.log('[HomeScreen] Outside meal window, showing modal');
        console.log('[HomeScreen] Next meal window:', mealWindowInfo.nextMealWindow, 'at', mealWindowInfo.nextMealWindowTime);
        setShowMealWindowModal(true);
      } else {
        console.log('[HomeScreen] Within meal window, no modal shown');
      }

      setHasCheckedMealWindow(true);
    }
  }, [hasCheckedMealWindow, mealWindowInfo, currentKitchen]);

  // Handle modal close - switch to the next meal window tab
  const handleMealWindowModalClose = () => {
    setShowMealWindowModal(false);
    setSelectedMeal(mealWindowInfo.nextMealWindow);
  };

  // Fetch menu using new flow: address → kitchens → menu
  const fetchMenu = async () => {
    console.log('[HomeScreen] === FETCH MENU STARTED ===');
    setIsLoadingMenu(true);
    setMenuError(null);
    setRequiresAddress(false);

    try {
      const mainAddress = getMainAddress();
      const addressId = selectedAddressId || mainAddress?.id;

      console.log('[HomeScreen] Address info:', {
        mainAddress: mainAddress ? { id: mainAddress.id, locality: mainAddress.locality } : null,
        selectedAddressId,
        finalAddressId: addressId,
        currentLocation: currentLocation ? { pincode: currentLocation.pincode } : null,
      });

      let kitchensResponse;

      // If no address but location is available, use pincode to get kitchens
      if (!addressId && currentLocation?.pincode) {
        console.log('[HomeScreen] No address, using location pincode:', currentLocation.pincode);

        try {
          // Step 1a: Get zone by pincode
          console.log('[HomeScreen] Calling getZoneByPincode...');
          const zoneResponse = await apiService.getZoneByPincode(currentLocation.pincode);
          console.log('[HomeScreen] Zone response:', JSON.stringify(zoneResponse, null, 2));

          if (!zoneResponse.data) {
            setMenuError('No kitchens available for your location. Please add a delivery address.');
            setRequiresAddress(true);
            setIsLoadingMenu(false);
            return;
          }

          // Access zone data - handle both nested and flat response structures
          const zoneData = (zoneResponse.data as any).zone || zoneResponse.data;
          const zoneId = zoneData._id;

          if (!zoneId) {
            setMenuError('No kitchens available for your location. Please add a delivery address.');
            setRequiresAddress(true);
            setIsLoadingMenu(false);
            return;
          }

          console.log('[HomeScreen] Zone found:', zoneId);

          // Step 1b: Get kitchens for the zone
          console.log('[HomeScreen] Calling getKitchensForZone...');
          kitchensResponse = await apiService.getKitchensForZone(zoneId, 'MEAL_MENU');
        } catch (error: any) {
          console.error('[HomeScreen] Error in zone/kitchen lookup:', error);
          throw error;
        }
      } else if (!addressId) {
        // If no address and no location, user needs to add one
        setRequiresAddress(true);
        setIsLoadingMenu(false);
        return;
      } else {
        // Step 1: Get kitchens for the address
        console.log('[HomeScreen] Calling getAddressKitchens with addressId:', addressId);
        try {
          kitchensResponse = await apiService.getAddressKitchens(addressId, 'MEAL_MENU');
        } catch (error: any) {
          console.error('[HomeScreen] Error in getAddressKitchens:', error);
          throw error;
        }
      }

      console.log('[HomeScreen] Raw kitchens response:', JSON.stringify(kitchensResponse, null, 2));

      // Extract kitchens using helper function (handles both old and new formats)
      const allKitchens = extractKitchensFromResponse(kitchensResponse);

      console.log('[HomeScreen] Extracted kitchens count:', allKitchens.length);
      console.log('[HomeScreen] First kitchen full data:', JSON.stringify(allKitchens[0], null, 2));

      if (!allKitchens.length) {
        setMenuError('No kitchens available for your location');
        setIsLoadingMenu(false);
        return;
      }

      console.log('[HomeScreen] Available kitchens:', allKitchens.map(k => ({
        name: k.name,
        type: k.type,
        _id: k._id,
        hasOperatingHours: !!k.operatingHours,
        lunchAvailable: !!k.operatingHours?.lunch,
        dinnerAvailable: !!k.operatingHours?.dinner,
      })));

      // Select the best kitchen based on:
      // 1. TIFFSY type preferred
      // 2. Has operating hours for current meal window
      // 3. Is accepting orders
      const now = new Date();
      const tifsyKitchens = allKitchens.filter(k => k.type === 'TIFFSY');
      const acceptingKitchens = allKitchens.filter(k => k.isAcceptingOrders !== false);

      let selectedKitchen: KitchenInfo | undefined;

      // Try to find TIFFSY kitchen with active meal window
      if (tifsyKitchens.length > 0) {
        selectedKitchen = tifsyKitchens.find(k => {
          if (!k.operatingHours) return true; // If no hours defined, assume available
          const info = getWindowInfo(k.operatingHours, now);
          return info.isWindowOpen;
        }) || tifsyKitchens[0]; // Fallback to first TIFFSY kitchen
      }

      // If no TIFFSY kitchen, try accepting kitchens with active window
      if (!selectedKitchen && acceptingKitchens.length > 0) {
        selectedKitchen = acceptingKitchens.find(k => {
          if (!k.operatingHours) return true;
          const info = getWindowInfo(k.operatingHours, now);
          return info.isWindowOpen;
        }) || acceptingKitchens[0];
      }

      // Last resort: pick any kitchen
      if (!selectedKitchen) {
        selectedKitchen = allKitchens[0];
      }

      console.log('[HomeScreen] Selected kitchen:', {
        name: selectedKitchen?.name,
        type: selectedKitchen?.type,
        operatingHours: selectedKitchen?.operatingHours,
      });

      setCurrentKitchen(selectedKitchen);
      // Set kitchen in cart context
      setKitchenId(selectedKitchen._id);
      // Set delivery address in cart context
      setDeliveryAddressId(addressId || null);

      // Step 2: Get menu for the kitchen
      console.log('[HomeScreen] Calling getKitchenMenu for kitchen:', selectedKitchen._id);
      let menuResponse;
      try {
        menuResponse = await apiService.getKitchenMenu(selectedKitchen._id, 'MEAL_MENU');
        console.log('[HomeScreen] Menu response:', JSON.stringify(menuResponse, null, 2));
      } catch (error: any) {
        console.error('[HomeScreen] Error in getKitchenMenu:', error);
        throw error;
      }

      if (menuResponse.data) {
        const { lunch, dinner } = menuResponse.data.mealMenu;
        console.log('[HomeScreen] Menu received - lunch:', lunch?._id || 'null', 'dinner:', dinner?._id || 'null');

        // Warn if menu items are null (kitchen may not have menu configured)
        if (!lunch && !dinner) {
          console.warn('[HomeScreen] Kitchen has no menu items configured!');
        }

        setMenuData({
          lunch: lunch,
          dinner: dinner,
          onDemandMenu: menuResponse.data.onDemandMenu || [],
        });

        // Set addons from the current meal
        const currentMealItem = selectedMeal === 'lunch' ? lunch : dinner;

        if (currentMealItem?.addonIds && currentMealItem.addonIds.length > 0) {
          console.log('[HomeScreen] Addons found:', currentMealItem.addonIds.length);
          const apiAddons: AddOn[] = currentMealItem.addonIds.map((addon: AddonItem) => ({
            id: addon._id,
            name: addon.name,
            image: require('../../assets/images/homepage/roti.png'), // Default image
            quantity: addon.description || '1 serving',
            price: addon.price,
            selected: false,
            count: 0,
          }));
          setAddOns(apiAddons);
        } else {
          console.log('[HomeScreen] No addons available for this meal');
          setAddOns([]);
        }
      }
    } catch (error: any) {
      console.error('[HomeScreen] Error fetching menu:', error);
      console.error('[HomeScreen] Error type:', typeof error);
      console.error('[HomeScreen] Error details:', {
        message: error.message,
        data: error.data,
        response: error.response?.data,
        stack: error.stack,
      });

      // Extract meaningful error message
      let errorMessage = 'Failed to load menu';

      // Handle different error formats
      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.message === 'Network Error') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message === 'timeout of 10000ms exceeded') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.log('[HomeScreen] Final error message:', errorMessage);
      setMenuError(errorMessage);
      setAddOns([]);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  // Fetch menu on mount and when address changes
  useEffect(() => {
    console.log('[HomeScreen] useEffect triggered - selectedAddressId:', selectedAddressId, 'addresses.length:', addresses.length);
    fetchMenu();
  }, [selectedAddressId, addresses.length]);

  // Also refetch menu when screen comes into focus (e.g., returning from AddressScreen)
  useFocusEffect(
    useCallback(() => {
      console.log('[HomeScreen] useFocusEffect triggered - refetching menu');
      fetchMenu();
    }, [selectedAddressId])
  );

  // Check for auto-ordering status and show notification
  useFocusEffect(
    useCallback(() => {
      const activeAutoOrderSub = subscriptions.find(
        sub => sub.status === 'ACTIVE' && sub.autoOrderingEnabled && !sub.isPaused
      );
      if (activeAutoOrderSub) {
        setShowAutoOrderNotification(true);
      }
    }, [subscriptions])
  );

  // Background data preload - triggers after menu loads successfully
  useFocusEffect(
    useCallback(() => {
      // Only trigger preload once per app session
      // Only when menu data has finished loading (no error, not loading)
      if (!hasPreloadedRef.current && !isLoadingMenu && !menuError && menuData) {
        console.log('[HomeScreen] 🚀 Starting background data preload');
        hasPreloadedRef.current = true;

        // Start background preload (non-blocking)
        // Pass context methods for preloader to call
        dataPreloader
          .startBackgroundPreload(
            { fetchSubscriptions, fetchVouchers },
            { fetchUnreadCount, fetchNotifications }
          )
          .catch(error => {
            console.warn('[HomeScreen] ⚠️ Background preload failed (non-critical):', error);
            // Don't show error to user - screens will fall back to on-demand fetch
          });
      }
    }, [isLoadingMenu, menuError, menuData, fetchSubscriptions, fetchVouchers, fetchUnreadCount, fetchNotifications])
  );

  // Sync local state with cart when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!menuData) return;

      const currentMealItem = selectedMeal === 'lunch' ? menuData.lunch : menuData.dinner;
      if (!currentMealItem?._id) return;

      // Find cart item for current meal
      const cartItem = cartItems.find(item => item.id === currentMealItem._id);

      if (cartItem) {
        console.log('[HomeScreen] Syncing local state with cart:', {
          quantity: cartItem.quantity,
          addons: cartItem.addons?.length || 0,
        });

        // Restore meal quantity from cart
        setMealQuantity(cartItem.quantity);

        // Restore addon selections and quantities from cart
        if (currentMealItem.addonIds && currentMealItem.addonIds.length > 0) {
          const restoredAddons = currentMealItem.addonIds.map((addon: AddonItem) => {
            // Check if this addon is in the cart
            const cartAddon = cartItem.addons?.find(a => a.addonId === addon._id);
            return {
              id: addon._id,
              name: addon.name,
              image: require('../../assets/images/homepage/roti.png'),
              quantity: addon.description || '1 serving',
              price: addon.price,
              selected: !!cartAddon,
              count: cartAddon?.quantity || 0,
            };
          });
          setAddOns(restoredAddons);
        }

        // Show cart modal if there are items
        setShowCartModal(true);
      } else {
        // No cart item - reset to defaults
        setMealQuantity(1);
        setShowCartModal(false);

        // Reset addons to unselected state with count 0
        if (currentMealItem.addonIds && currentMealItem.addonIds.length > 0) {
          const defaultAddons = currentMealItem.addonIds.map((addon: AddonItem) => ({
            id: addon._id,
            name: addon.name,
            image: require('../../assets/images/homepage/roti.png'),
            quantity: addon.description || '1 serving',
            price: addon.price,
            selected: false,
            count: 0,
          }));
          setAddOns(defaultAddons);
        }
      }
    }, [cartItems, selectedMeal, menuData])
  );

  // Update addons when meal type changes - sync with cart
  useEffect(() => {
    if (menuData) {
      const currentMealItem = selectedMeal === 'lunch' ? menuData.lunch : menuData.dinner;

      // Find cart item for current meal
      const cartItem = currentMealItem?._id ? cartItems.find(item => item.id === currentMealItem._id) : null;

      if (currentMealItem?.addonIds && currentMealItem.addonIds.length > 0) {
        const apiAddons: AddOn[] = currentMealItem.addonIds.map((addon: AddonItem) => {
          // Check if this addon is in the cart
          const cartAddon = cartItem?.addons?.find(a => a.addonId === addon._id);
          return {
            id: addon._id,
            name: addon.name,
            image: require('../../assets/images/homepage/roti.png'),
            quantity: addon.description || '1 serving',
            price: addon.price,
            selected: !!cartAddon,
            count: cartAddon?.quantity || 0,
          };
        });
        setAddOns(apiAddons);
      } else {
        setAddOns([]);
      }

      // Sync meal quantity and modal state
      if (cartItem) {
        setMealQuantity(cartItem.quantity);
        setShowCartModal(true);
      } else {
        setMealQuantity(1);
        setShowCartModal(false);
      }
    }
  }, [selectedMeal, menuData, cartItems]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMenu();
    setRefreshing(false);
  };

  // Get display location from main address or current location
  const getDisplayLocation = () => {
    const mainAddress = getMainAddress();
    if (mainAddress) {
      return `${mainAddress.locality}, ${mainAddress.city}`;
    }
    // Fallback to current location if available
    if (currentLocation?.address?.city) {
      return `${currentLocation.address.locality || currentLocation.address.city}, ${currentLocation.address.city}`;
    }
    return 'Select Location';
  };

  // Get current meal item from menu
  const getCurrentMealItem = (): MenuItem | undefined => {
    if (!menuData) return undefined;
    return selectedMeal === 'lunch' ? menuData.lunch : menuData.dinner;
  };

  // Get meal price
  const getMealPrice = (): number => {
    const mealItem = getCurrentMealItem();
    return mealItem?.discountedPrice || mealItem?.price || 0;
  };

  // Helper to check if ID is a valid MongoDB ObjectId (24-character hex string)
  const isValidObjectId = (id: string): boolean => {
    return /^[a-fA-F0-9]{24}$/.test(id);
  };

  // Helper to update cart with current meal and addons
  const updateCartWithAddons = (updatedAddOns: AddOn[]) => {
    const mealItem = getCurrentMealItem();

    // Check if we have a valid meal item ID from the API
    const mealItemId = mealItem?._id;
    if (!mealItemId || !isValidObjectId(mealItemId)) {
      console.error('[HomeScreen] Cannot add to cart: Invalid or missing meal item ID:', mealItemId);
      console.error('[HomeScreen] Menu item data:', JSON.stringify(mealItem, null, 2));
      return; // Don't add to cart with invalid ID
    }

    const mealPrice = getMealPrice();
    const mealName = mealItem.name;
    const mealWindowValue = selectedMeal === 'lunch' ? 'LUNCH' : 'DINNER';

    // Set cart context for order creation
    setMenuType('MEAL_MENU');
    setMealWindow(mealWindowValue);

    // Build addons array - only include addons with valid MongoDB ObjectIds and count > 0
    const selectedAddons = updatedAddOns
      .filter(item => item.selected && item.count > 0 && isValidObjectId(item.id))
      .map(item => ({
        addonId: item.id,
        name: item.name,
        quantity: item.count,
        unitPrice: item.price,
      }));

    // Log if any selected addons were excluded due to invalid IDs
    const invalidAddons = updatedAddOns.filter(item => item.selected && !isValidObjectId(item.id));
    if (invalidAddons.length > 0) {
      console.warn('[HomeScreen] Excluded addons with invalid IDs:', invalidAddons.map(a => ({ id: a.id, name: a.name })));
    }

    const cartItem = {
      id: mealItemId, // Only use valid _id from API
      name: mealName,
      image: selectedMeal === 'lunch'
        ? require('../../assets/images/homepage/lunch2.png')
        : require('../../assets/images/homepage/dinneritem.png'),
      subtitle: '1 Thali',
      price: mealPrice,
      quantity: mealQuantity,
      hasVoucher: mealItem?.canUseVoucher ?? true,
      addons: selectedAddons.length > 0 ? selectedAddons : undefined,
    };

    console.log('[HomeScreen] updateCartWithAddons - Cart item:', JSON.stringify({
      id: cartItem.id,
      name: cartItem.name,
      addons: cartItem.addons,
    }));

    replaceCart(cartItem);
  };

  const toggleAddOn = (id: string) => {
    // Calculate the new addons state
    const updatedAddOns = addOns.map(item => {
      if (item.id === id) {
        // When selecting, set count to 1
        // When deselecting, reset count to 0
        return {
          ...item,
          selected: !item.selected,
          count: !item.selected ? 1 : 0
        };
      }
      return item;
    });

    // Update local state
    setAddOns(updatedAddOns);

    // Immediately update cart with the new addons
    updateCartWithAddons(updatedAddOns);

    // Show cart modal when an addon is selected
    const toggledItem = updatedAddOns.find(item => item.id === id);
    if (toggledItem?.selected) {
      setShowCartModal(true);
    }
  };

  const updateQuantity = (id: string, increment: boolean) => {
    const updatedAddOns = addOns.map(item => {
      if (item.id === id) {
        const newCount = increment ? item.count + 1 : Math.max(0, item.count - 1);

        // If count goes to 0, deselect the addon
        if (newCount === 0) {
          return { ...item, count: 0, selected: false };
        }

        return { ...item, count: newCount };
      }
      return item;
    });

    // Update local state
    setAddOns(updatedAddOns);

    // Immediately update cart with the new quantity
    updateCartWithAddons(updatedAddOns);
  };

  const handleAddToCart = () => {
    const mealItem = getCurrentMealItem();

    // Don't allow adding to cart if no valid menu item
    if (!mealItem?._id || !isValidObjectId(mealItem._id)) {
      console.error('[HomeScreen] Cannot add to cart: No valid menu item available');
      return;
    }

    const mealPrice = getMealPrice();
    const mealName = mealItem.name;
    const mealWindow = selectedMeal === 'lunch' ? 'LUNCH' : 'DINNER';

    // Set cart context for order creation
    setMenuType('MEAL_MENU');
    setMealWindow(mealWindow);

    // Build addons array for the meal item - only include items with count > 0
    const selectedAddons = addOns
      .filter(item => item.selected && item.count > 0)
      .map(item => ({
        addonId: item.id,
        name: item.name,
        quantity: item.count,
        unitPrice: item.price,
      }));

    // Debug logging
    console.log('[HomeScreen] handleAddToCart called');
    console.log('[HomeScreen] All addOns state:', JSON.stringify(addOns.map(a => ({ name: a.name, selected: a.selected, count: a.count }))));
    console.log('[HomeScreen] Selected addons:', JSON.stringify(selectedAddons));

    const cartItem = {
      id: mealItem._id,
      name: mealName,
      image: selectedMeal === 'lunch'
        ? require('../../assets/images/homepage/lunch2.png')
        : require('../../assets/images/homepage/dinneritem.png'),
      subtitle: '1 Thali',
      price: mealPrice,
      quantity: mealQuantity,
      hasVoucher: mealItem.canUseVoucher ?? true,
      addons: selectedAddons.length > 0 ? selectedAddons : undefined,
    };

    console.log('[HomeScreen] Cart item to add:', JSON.stringify({
      id: cartItem.id,
      name: cartItem.name,
      addons: cartItem.addons,
    }));

    // Replace cart with new meal (atomic operation to avoid race conditions with addons)
    replaceCart(cartItem);

    // Show cart modal
    setShowCartModal(true);
  };

  const updateMealQuantity = (increment: boolean) => {
    const newQuantity = increment ? mealQuantity + 1 : Math.max(1, mealQuantity - 1);

    // Update local state
    setMealQuantity(newQuantity);

    // Update cart if item already added (modal is showing)
    if (showCartModal) {
      const mealItem = getCurrentMealItem();
      if (mealItem?._id && isValidObjectId(mealItem._id)) {
        updateCartItemQuantity(mealItem._id, newQuantity);
      }
    }
  };

  const getSelectedAddOnsCount = () => {
    return addOns.filter(item => item.selected).length;
  };

  const getFilteredAddOns = () => {
    if (!searchQuery.trim()) {
      return addOns;
    }
    return addOns.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredAddOns = getFilteredAddOns();

  // Get meal name
  const getMealName = (): string => {
    const mealItem = getCurrentMealItem();
    return mealItem?.name || '';
  };

  // Get meal description
  const getMealDescription = (): string => {
    const mealItem = getCurrentMealItem();
    return mealItem?.description || '';
  };

  return (
    <SafeAreaView className="flex-1 bg-orange-400">
      <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />

      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F56B4C']} />
        }
      >
        {/* Header */}
        <View className="bg-orange-400 pb-8" style={{ position: 'relative', overflow: 'hidden', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
          {/* Decorative Background Elements */}
          <Image
            source={require('../../assets/images/homepage/halfcircle.png')}
            style={{ position: 'absolute', top: -90, right: -125, width: 300, height: 380, borderRadius: 150 }}
            resizeMode="contain"
          />
          <Image
            source={require('../../assets/images/homepage/halfline.png')}
            style={{ position: 'absolute', top: 30, right: -150, width: 380, height: 150, borderRadius: 20 }}
            resizeMode="contain"
          />

          <View className="px-5 pt-4 pb-6">
            {/* Top Row: Logo, Location, Actions */}
            <View className="flex-row items-center justify-between mb-4">
              {/* Logo */}
              <View style={{ width: isSmallDevice ? SPACING.iconXl * 1.2 : SPACING.iconXl * 1.45 }}>
                <Image
                  source={require('../../assets/icons/Tiffsy.png')}
                  style={{
                    width: isSmallDevice ? SPACING.iconXl * 1.2 : SPACING.iconXl * 1.45,
                    height: isSmallDevice ? SPACING.iconXl * 0.7 : SPACING.iconXl * 0.875,
                    borderRadius: 8,
                  }}
                  resizeMode="contain"
                />
              </View>

              {/* Location */}
              <TouchableOpacity
                className="flex-1 items-center mx-3"
                onPress={() => navigation.navigate('Address')}
              >
                <Text className="text-white opacity-90" style={{ fontSize: FONT_SIZES.xs }}>Location</Text>
                <View className="flex-row items-center mt-1">
                  {isGettingLocation ? (
                    <>
                      <ActivityIndicator size="small" color="white" style={{ marginRight: 4 }} />
                      <Text className="text-white text-sm font-semibold" numberOfLines={1}>
                        Detecting...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Image
                        source={require('../../assets/icons/address3.png')}
                        style={{ width: SPACING.iconSm, height: SPACING.iconSm, tintColor: 'white' }}
                        resizeMode="contain"
                      />
                      <Text className="text-white font-semibold ml-1" style={{ fontSize: FONT_SIZES.sm }} numberOfLines={1}>
                        {getDisplayLocation()}
                      </Text>
                      <Image
                        source={require('../../assets/icons/down2.png')}
                        style={{ width: SPACING.iconXs, height: SPACING.iconXs, marginLeft: 4, tintColor: 'white' }}
                        resizeMode="contain"
                      />
                    </>
                  )}
                </View>
              </TouchableOpacity>

              {/* Right Actions: Notification Bell & Voucher */}
              <View className="flex-row items-center" style={{ gap: SPACING.md }}>
                {/* Notification Bell */}
                <NotificationBell color="white" size={SPACING.iconSize} />

                {/* Voucher Button */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('MealPlans')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'white',
                    borderRadius: SPACING.lg,
                    paddingVertical: SPACING.xs + 1,
                    paddingHorizontal: SPACING.sm,
                    gap: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Image
                    source={require('../../assets/icons/voucher5.png')}
                    style={{ width: SPACING.iconSm + 2, height: SPACING.iconSm + 2 }}
                    resizeMode="contain"
                  />
                  <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: 'bold', color: '#F56B4C' }}>
                    {usableVouchers}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

            {/* Search Bar */}
            <View
              className="mx-5 bg-white rounded-full flex-row items-center px-4"
              style={{
                height: SPACING['2xl'] + SPACING.lg,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Image
                source={require('../../assets/icons/search2.png')}
                style={{ width: SPACING.iconSm, height: SPACING.iconSm }}
                resizeMode="contain"
              />
              <TextInput
                placeholder="Search for addons to your meal..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 text-gray-700 ml-2"
                style={{
                  fontSize: FONT_SIZES.sm,
                  paddingVertical: 0,
                  paddingTop: 0,
                  paddingBottom: 0,
                  includeFontPadding: false,
                  textAlignVertical: 'center',
                  height: SPACING['2xl'] + SPACING.lg
                }}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text className="text-gray-400" style={{ fontSize: FONT_SIZES.lg }}>×</Text>
                </TouchableOpacity>
              )}
            </View>
        </View>

        {/* Auto-Order Notification Banner */}
        {showAutoOrderNotification && subscriptions.find(
          sub => sub.status === 'ACTIVE' && sub.autoOrderingEnabled && !sub.isPaused
        ) && (
          <View style={{
            marginHorizontal: SPACING.lg,
            marginBottom: SPACING.md,
            marginTop: SPACING.md,
            zIndex: 10,
            position: 'relative',
          }}>
            <View
              style={{
                backgroundColor: '#FFF5F2',
                borderRadius: SPACING.lg,
                padding: SPACING.lg,
                flexDirection: 'row',
                alignItems: 'center',
                borderLeftWidth: 4,
                borderLeftColor: '#F56B4C',
                shadowColor: '#F56B4C',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              {/* Icon Container */}
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#F56B4C',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: SPACING.md,
                }}
              >
                <Text style={{ fontSize: 20 }}>⚡</Text>
              </View>

              {/* Content */}
              <View style={{ flex: 1, paddingRight: SPACING.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <View
                    style={{
                      backgroundColor: '#10B981',
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      marginRight: 6,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: FONT_SIZES.base,
                      fontWeight: '700',
                      color: '#1F2937',
                      letterSpacing: 0.2,
                    }}
                  >
                    Auto-Order Active
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: FONT_SIZES.sm,
                    color: '#6B7280',
                    lineHeight: FONT_SIZES.sm * 1.4,
                    marginTop: 2,
                  }}
                >
                  {(() => {
                    const sub = subscriptions.find(s => s.status === 'ACTIVE' && s.autoOrderingEnabled && !s.isPaused);
                    if (!sub) return 'Your meals will be automatically ordered';

                    const nextOrderTime = formatNextAutoOrderTime(sub);

                    // Determine which specific meal is coming next
                    let mealType = 'Your order';
                    if (sub.defaultMealType === 'LUNCH') {
                      mealType = 'Lunch';
                    } else if (sub.defaultMealType === 'DINNER') {
                      mealType = 'Dinner';
                    } else if (sub.defaultMealType === 'BOTH') {
                      // For BOTH, determine which meal is next based on current time
                      const now = new Date();
                      const currentHour = now.getHours();

                      // Get operating hours for accurate calculation
                      const operatingHours = currentKitchen?.operatingHours;

                      // Default lunch auto-order time is 10:00 AM (1 hour before 11:00 AM)
                      // Default dinner auto-order time is 6:00 PM (1 hour before 7:00 PM)
                      let lunchAutoOrderHour = 10;
                      let dinnerAutoOrderHour = 18;

                      // If operating hours are available, calculate accurate times
                      if (operatingHours?.lunch?.startTime) {
                        const [hoursStr] = operatingHours.lunch.startTime.split(':');
                        lunchAutoOrderHour = parseInt(hoursStr, 10) - 1;
                      }
                      if (operatingHours?.dinner?.startTime) {
                        const [hoursStr] = operatingHours.dinner.startTime.split(':');
                        dinnerAutoOrderHour = parseInt(hoursStr, 10) - 1;
                      }

                      // Determine next meal based on current time
                      if (currentHour < lunchAutoOrderHour) {
                        mealType = 'Lunch';
                      } else if (currentHour < dinnerAutoOrderHour) {
                        mealType = 'Dinner';
                      } else {
                        // After dinner time, next meal is lunch tomorrow
                        mealType = 'Lunch';
                      }
                    }

                    return `${mealType} will be automatically ordered ${nextOrderTime}`;
                  })()}
                </Text>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                onPress={() => setShowAutoOrderNotification(false)}
                style={{
                  width: 32,
                  height: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 16,
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ color: '#9CA3AF', fontSize: 24, fontWeight: '300' }}>×</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* White Container with Meal Options and Image */}
        <View className="mb-6" style={{ position: 'relative', overflow: 'visible', marginTop: -30 }}>
          {/* Background Image */}
          <Image
            source={require('../../assets/images/homepage/homebackground.png')}
            style={{
              position: 'absolute',
              top: -200,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '150%',
              opacity: 0.17,
            }}
            resizeMode="cover"
          />

          {/* Meal Type Tabs */}
          <View className="flex-row justify-center pt-10 mb-6">
            <TouchableOpacity
              onPress={() => setSelectedMeal('lunch')}
              className={`items-center mx-6 ${selectedMeal === 'lunch' ? '' : 'opacity-50'}`}
            >
              <View style={{ height: SPACING.iconXl * 2, width: SPACING.iconXl * 2, alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
                <Image
                  source={require('../../assets/images/homepage/lunch1.png')}
                  style={{
                    width: selectedMeal === 'lunch' ? SPACING.iconXl * 2 : SPACING.iconXl * 1.6,
                    height: selectedMeal === 'lunch' ? SPACING.iconXl * 2 : SPACING.iconXl * 1.6,
                    borderRadius: 12,
                  }}
                  resizeMode="contain"
                />
              </View>
              <Text
                className={`font-semibold ${
                  selectedMeal === 'lunch' ? 'text-orange-400' : 'text-gray-400'
                }`}
                style={{ fontSize: FONT_SIZES.base }}
              >
                Lunch
              </Text>
              {selectedMeal === 'lunch' && (
                <Image
                  source={require('../../assets/icons/borderline.png')}
                  style={{ width: SPACING['5xl'] * 2, height: SPACING.sm, marginTop: 4 }}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedMeal('dinner')}
              className={`items-center mx-6 ${selectedMeal === 'dinner' ? '' : 'opacity-50'}`}
            >
              <View style={{ height: SPACING.iconXl * 2, width: SPACING.iconXl * 2, alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
                <Image
                  source={require('../../assets/images/homepage/dinner1.png')}
                  style={{
                    width: selectedMeal === 'dinner' ? SPACING.iconXl * 2 : SPACING.iconXl * 1.6,
                    height: selectedMeal === 'dinner' ? SPACING.iconXl * 2 : SPACING.iconXl * 1.6,
                    borderRadius: 12,
                  }}
                  resizeMode="contain"
                />
              </View>
              <Text
                className={`font-semibold ${
                  selectedMeal === 'dinner' ? 'text-orange-400' : 'text-gray-400'
                }`}
                style={{ fontSize: FONT_SIZES.base }}
              >
                Dinner
              </Text>
              {selectedMeal === 'dinner' && (
                <Image
                  source={require('../../assets/icons/borderline.png')}
                  style={{ width: SPACING['5xl'] * 2, height: SPACING.sm, marginTop: 4 }}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Main Meal Image */}
          <View className="items-center justify-center pb-16" style={{ width: '100%' }}>
            <Image
              source={
                selectedMeal === 'lunch'
                  ? require('../../assets/images/homepage/lunchThali.png')
                  : require('../../assets/images/homepage/dinnerThali.png')
              }
              style={{ width: width * 0.95, height: width * 0.95, alignSelf: 'center', marginLeft: SPACING.lg + 4 }}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Special Thali, Details and Add-ons Container */}
        <View
          className="bg-white px-6 pt-5 pb-10"
          style={{
            marginTop: -60,
            borderTopLeftRadius: 33,
            borderTopRightRadius: 33,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {/* Loading State */}
          {isLoadingMenu && (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="large" color="#F56B4C" />
              <Text className="text-gray-500 mt-3">Loading menu...</Text>
            </View>
          )}

          {/* Error State */}
          {menuError && !isLoadingMenu && (
            <View className="items-center justify-center py-8 px-4">
              <Text className="text-red-500 text-lg mb-2">Oops!</Text>
              <Text className="text-gray-600 text-center mb-4">{menuError}</Text>
              <TouchableOpacity
                onPress={fetchMenu}
                className="bg-orange-400 px-6 py-3 rounded-full"
              >
                <Text className="text-white font-semibold">Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Requires Address State */}
          {requiresAddress && !isLoadingMenu && (
            <View className="items-center justify-center py-8 px-4">
              <Text className="text-6xl mb-4">📍</Text>
              <Text className="text-xl font-bold text-gray-900 mb-2">Add Your Address</Text>
              <Text className="text-gray-600 text-center mb-4">
                Please add a delivery address to see the menu
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Address')}
                className="bg-orange-400 px-6 py-3 rounded-full"
              >
                <Text className="text-white font-semibold">Add Address</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* No Meal Available Error */}
          {!isLoadingMenu && !menuError && !requiresAddress && !getCurrentMealItem() && (
            <View className="items-center justify-center py-8 px-4">
              <Text className="text-6xl mb-4">🍽️</Text>
              <Text className="text-xl font-bold text-gray-900 mb-2">
                {selectedMeal === 'lunch' ? 'Lunch' : 'Dinner'} Not Available
              </Text>
              <Text className="text-gray-600 text-center mb-4">
                The {selectedMeal} menu is currently not available. Please try the other meal option.
              </Text>
              <TouchableOpacity
                onPress={fetchMenu}
                className="bg-orange-400 px-6 py-3 rounded-full"
              >
                <Text className="text-white font-semibold">Refresh</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Special Thali and Add to Cart */}
          {!isLoadingMenu && !menuError && !requiresAddress && getCurrentMealItem() && (
          <>
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1">
              <Text className="font-bold text-gray-900" style={{ fontSize: FONT_SIZES.h3 }}>{getMealName()}</Text>
              <Text className="text-gray-600 mt-1" style={{ fontSize: FONT_SIZES.base }}>
                From: <Text className="font-semibold text-gray-900">₹{getMealPrice().toFixed(2)}</Text>
              </Text>
            </View>
            {!showCartModal ? (
              <TouchableOpacity
                onPress={handleAddToCart}
                activeOpacity={0.7}
                style={{
                  backgroundColor: 'rgba(245, 107, 76, 1)',
                  borderRadius: SPACING['3xl'],
                  width: SPACING['5xl'] * 3.125,
                  height: SPACING['2xl'] + SPACING.xl + 1,
                  paddingHorizontal: SPACING.xl + 4,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: SPACING['2xl'] + SPACING.xl + 1,
                    height: SPACING['2xl'] + SPACING.xl + 1,
                    borderRadius: SPACING['2xl'] + 4,
                    backgroundColor: 'rgba(255, 148, 92, 1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: -(SPACING['3xl']),
                  }}
                >
                  <Image
                    source={require('../../assets/icons/cart3.png')}
                    style={{ width: SPACING.lg + 4, height: SPACING.lg + 4, tintColor: 'rgba(255, 255, 255, 1)' }}
                    resizeMode="contain"
                  />
                </View>
                <Text style={{ color: 'white', fontSize: FONT_SIZES.sm, fontWeight: '600', marginLeft: SPACING.md }}>Add to Cart</Text>
              </TouchableOpacity>
            ) : (
              <View
                style={{
                  backgroundColor: 'white',
                  borderRadius: SPACING['3xl'],
                  height: SPACING['2xl'] + SPACING.lg,
                  paddingHorizontal: SPACING.xs + 2,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minWidth: SPACING['4xl'] + SPACING['3xl'] - 2,
                  borderWidth: 1,
                  borderColor: 'rgba(232, 235, 234, 1)',
                }}
              >
                <TouchableOpacity
                  onPress={() => updateMealQuantity(false)}
                  style={{
                    width: SPACING.xl + 8,
                    height: SPACING.xl + 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image
                    source={require('../../assets/icons/subtract.png')}
                    style={{ width: SPACING.xs + 6, height: SPACING.xs + 6 }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <Text style={{ color: 'rgba(0, 0, 0, 1)', fontSize: FONT_SIZES.lg, fontWeight: '600', marginHorizontal: SPACING.sm }}>{mealQuantity}</Text>
                <TouchableOpacity
                  onPress={() => updateMealQuantity(true)}
                  style={{
                    width: SPACING.xl + 8,
                    height: SPACING.xl + 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image
                    source={require('../../assets/icons/plus.png')}
                    style={{ width: SPACING['3xl'] - 2, height: SPACING['3xl'] }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Details Section */}
          <View className="mb-6">
            <Text className="font-bold text-gray-900 mb-3" style={{ fontSize: FONT_SIZES.h4 }}>Details</Text>
            <Text className="text-gray-600" style={{ fontSize: FONT_SIZES.base, lineHeight: FONT_SIZES.base * 1.5 }}>
              {getMealDescription()}
            </Text>
            {getCurrentMealItem()?.includes && getCurrentMealItem()!.includes!.length > 0 && (
              <View className="mt-4 bg-orange-50 p-4" style={{ borderRadius: SPACING['2xl'], borderWidth: 1, borderColor: 'rgba(251, 146, 60, 0.3)' }}>
                <Text className="font-bold text-gray-900 mb-3" style={{ fontSize: FONT_SIZES.base }}>What's Included</Text>
                <View className="flex-row flex-wrap" style={{ marginHorizontal: -6 }}>
                  {getCurrentMealItem()!.includes!.map((item, index) => (
                    <View key={index} className="flex-row items-start mb-3" style={{ width: '50%', paddingHorizontal: 6 }}>
                      <View className="rounded-full bg-orange-400 items-center justify-center mr-2" style={{ width: SPACING.lg + 4, height: SPACING.lg + 4, marginTop: 2 }}>
                        <Text className="text-white font-bold" style={{ fontSize: FONT_SIZES.xs }}>✓</Text>
                      </View>
                      <Text className="text-gray-700" style={{ fontSize: FONT_SIZES.sm, flex: 1 }}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Add-ons Section */}
          <View>
            <Text className="font-bold text-gray-900 mb-4" style={{ fontSize: FONT_SIZES.h4 }}>Add-ons</Text>

            {filteredAddOns.length > 0 ? (
              filteredAddOns.map((item) => (
                <View
                  key={item.id}
                  className="flex-row items-center justify-between py-2"
                >
                  {/* Item Image and Info */}
                  <View className="flex-row items-center flex-1">
                    <Image
                      source={item.image}
                      style={{ width: SPACING.iconXl + 16, height: SPACING.iconXl + 16, borderRadius: (SPACING.iconXl + 16) / 2 }}
                      resizeMode="cover"
                    />
                    <View className="ml-4 flex-1">
                      <Text className="font-semibold text-gray-900" style={{ fontSize: FONT_SIZES.base }}>
                        {item.name}
                      </Text>
                      <Text className="text-gray-500 mt-0.5" style={{ fontSize: FONT_SIZES.sm }}>
                        {item.quantity} <Text className="font-semibold text-gray-900">+ ₹{item.price}.00</Text>
                      </Text>
                    </View>
                  </View>

                  {/* Quantity Controls and Add Button */}
                  <View className="flex-row items-center">
                    <Animated.View
                      style={{
                        opacity: item.selected ? 1 : 0,
                        transform: [
                          {
                            scale: item.selected ? 1 : 0.8,
                          },
                        ],
                      }}
                    >
                      {item.selected && (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#FFF5F2',
                            borderRadius: 18,
                            paddingVertical: 8,
                            paddingHorizontal: 8,
                            borderWidth: 1,
                            borderColor: '#F56B4C',
                            minWidth: 60,
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => updateQuantity(item.id, false)}
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              backgroundColor: 'white',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderWidth: 1,
                              borderColor: '#F56B4C',
                            }}
                          >
                            <Text style={{ color: '#F56B4C', fontSize: 14, fontWeight: '600' }}>−</Text>
                          </TouchableOpacity>
                          <Text
                            style={{
                              marginHorizontal: 8,
                              fontWeight: '600',
                              fontSize: FONT_SIZES.sm,
                              color: '#F56B4C',
                              minWidth: 12,
                              textAlign: 'center',
                            }}
                          >
                            {item.count}
                          </Text>
                          <TouchableOpacity
                            onPress={() => updateQuantity(item.id, true)}
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              backgroundColor: '#F56B4C',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>+</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </Animated.View>
                    {!item.selected && (
                      <Animated.View
                        style={{
                          opacity: !item.selected ? 1 : 0,
                          transform: [
                            {
                              scale: !item.selected ? 1 : 0.8,
                            },
                          ],
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => toggleAddOn(item.id)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 18,
                            backgroundColor: '#F56B4C',
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: '#F56B4C',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            elevation: 3,
                            minWidth: 60,
                          }}
                        >
                          <Text style={{ color: 'white', fontSize: FONT_SIZES.sm, fontWeight: '600' }}>Add</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View className="py-10 items-center">
                <Text className="text-gray-400" style={{ fontSize: FONT_SIZES.base }}>No items found</Text>
                <Text className="text-gray-400 mt-2" style={{ fontSize: FONT_SIZES.sm }}>Try searching for something else</Text>
              </View>
            )}
          </View>
          </>
          )}

          {/* Bottom Spacing for Navigation Bar and Cart Popup */}
          <View style={{ height: (showCartModal ? 160 : 100) + insets.bottom }} />
        </View>
      </ScrollView>

      {/* Cart Popup - Sticky at bottom */}
      {showCartModal && (
        <View
          className="absolute left-5 right-5 bg-white rounded-full px-5 flex-row items-center justify-between"
          style={{
            bottom: SPACING['4xl'] * 2 + insets.bottom,
            paddingVertical: SPACING.md,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 10,
          }}
        >
          {/* Meal Image and Info */}
          <View className="flex-row items-center flex-1">
            <Image
              source={
                selectedMeal === 'lunch'
                  ? require('../../assets/images/homepage/lunch2.png')
                  : require('../../assets/images/homepage/dinneritem.png')
              }
              style={{ width: SPACING['5xl'], height: SPACING['5xl'], borderRadius: SPACING['5xl'] / 2 }}
              resizeMode="cover"
            />
            <View className="ml-3 flex-1" style={{ marginRight: 10 }}>
              <Text className="font-bold text-gray-900" style={{ fontSize: FONT_SIZES.base }} numberOfLines={1}>{getMealName()}</Text>
              <Text className="text-gray-500 mt-0.5" style={{ fontSize: FONT_SIZES.xs }}>
                {getSelectedAddOnsCount()} Add-ons
              </Text>
            </View>
          </View>

          {/* View Cart Button */}
          <TouchableOpacity
            className="bg-orange-400 rounded-full flex-row items-center"
            style={{ paddingHorizontal: SPACING.lg + 4, paddingVertical: SPACING.xs + 6 }}
            onPress={() => navigation.navigate('Cart')}
          >
            <Image
              source={require('../../assets/icons/cart3.png')}
              style={{ width: SPACING.iconSm + 2, height: SPACING.iconSm + 2, tintColor: 'white', marginRight: 6 }}
              resizeMode="contain"
            />
            <Text className="text-white font-semibold" style={{ fontSize: FONT_SIZES.sm }} numberOfLines={1}>View Cart</Text>
          </TouchableOpacity>

          {/* Close Button */}
          <TouchableOpacity
            onPress={() => setShowCartModal(false)}
            className="items-center justify-center"
            style={{ width: SPACING.lg * 2, height: SPACING.lg * 2, marginRight: -12 }}
          >
            <Text className="text-gray-500" style={{ fontSize: FONT_SIZES.h3 }}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Meal Window Modal - Shows when ordering window is closed */}
      <MealWindowModal
        visible={showMealWindowModal}
        nextMealWindow={mealWindowInfo.nextMealWindow}
        nextMealWindowTime={mealWindowInfo.nextMealWindowTime}
        onClose={handleMealWindowModalClose}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;
