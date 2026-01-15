// src/screens/home/HomeScreen.tsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { MainTabParamList } from '../../types/navigation';
import { useCart } from '../../context/CartContext';
import { useAddress } from '../../context/AddressContext';
import { useSubscription } from '../../context/SubscriptionContext';
import apiService, { KitchenInfo, MenuItem, AddonItem, extractKitchensFromResponse } from '../../services/api.service';
import MealWindowModal from '../../components/MealWindowModal';
import { getMealWindowInfo as getWindowInfo, isMealWindowAvailable } from '../../utils/timeUtils';

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
    replaceCart,
    setKitchenId,
    setMenuType,
    setMealWindow,
    setDeliveryAddressId,
  } = useCart();
  const { getMainAddress, selectedAddressId, addresses, currentLocation, isGettingLocation } = useAddress();
  const { usableVouchers } = useSubscription();
  const [selectedMeal, setSelectedMeal] = useState<MealType>('lunch');
  const [showCartModal, setShowCartModal] = useState(false);
  const [mealQuantity, setMealQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'meals' | 'profile'>('home');
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

  // Note: We no longer use fallback addons with fake IDs as they cause API validation errors
  // Addons must come from the API with valid MongoDB ObjectIds
  // If no addons are returned from API, we show an empty list

  // Get meal window info dynamically from kitchen's operating hours
  const mealWindowInfo = useMemo(() => {
    console.log('[HomeScreen] Calculating meal window info - Kitchen:', currentKitchen?.name);
    console.log('[HomeScreen] Operating hours available:', !!currentKitchen?.operatingHours);
    console.log('[HomeScreen] Operating hours:', JSON.stringify(currentKitchen?.operatingHours, null, 2));

    if (!currentKitchen?.operatingHours) {
      console.log('[HomeScreen] Using fallback logic (no operating hours)');
      // Fallback to default behavior if no operating hours available
      const now = new Date();
      const currentHour = now.getHours();

      if (currentHour < 11) {
        return {
          activeMeal: 'lunch' as MealType,
          isWindowOpen: true,
          nextMealWindow: 'lunch' as MealType,
          nextMealWindowTime: '6:00 AM',
        };
      }

      if (currentHour >= 11 && currentHour < 21) {
        return {
          activeMeal: 'dinner' as MealType,
          isWindowOpen: true,
          nextMealWindow: 'dinner' as MealType,
          nextMealWindowTime: '11:00 AM',
        };
      }

      return {
        activeMeal: 'lunch' as MealType,
        isWindowOpen: false,
        nextMealWindow: 'lunch' as MealType,
        nextMealWindowTime: '6:00 AM tomorrow',
      };
    }

    // Use dynamic operating hours from kitchen
    console.log('[HomeScreen] Using dynamic operating hours');
    const windowInfo = getWindowInfo(currentKitchen.operatingHours);
    console.log('[HomeScreen] Calculated window info:', windowInfo);
    return windowInfo;
  }, [currentKitchen]);

  // Reset activeTab to 'home' when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setActiveTab('home');
    }, [])
  );

  // Initialize meal tab based on current time and show modal if outside window
  useEffect(() => {
    if (!hasCheckedMealWindow) {
      console.log('[HomeScreen] Checking meal window - Current hour:', new Date().getHours());
      console.log('[HomeScreen] Meal window info:', mealWindowInfo);

      // Set the initial meal based on current time
      setSelectedMeal(mealWindowInfo.activeMeal);

      // If outside meal window, show the modal
      if (!mealWindowInfo.isWindowOpen) {
        console.log('[HomeScreen] Outside meal window, showing modal');
        setShowMealWindowModal(true);
      }

      setHasCheckedMealWindow(true);
    }
  }, [hasCheckedMealWindow, mealWindowInfo]);

  // Handle modal close - switch to the next meal window tab
  const handleMealWindowModalClose = () => {
    setShowMealWindowModal(false);
    setSelectedMeal(mealWindowInfo.nextMealWindow);
  };

  // Fetch menu using new flow: address → kitchens → menu
  const fetchMenu = async () => {
    setIsLoadingMenu(true);
    setMenuError(null);
    setRequiresAddress(false);

    try {
      const mainAddress = getMainAddress();
      const addressId = selectedAddressId || mainAddress?.id;

      let kitchensResponse;

      // If no address but location is available, use pincode to get kitchens
      if (!addressId && currentLocation?.pincode) {
        console.log('[HomeScreen] No address, using location pincode:', currentLocation.pincode);

        // Step 1a: Get zone by pincode
        const zoneResponse = await apiService.getZoneByPincode(currentLocation.pincode);

        if (!zoneResponse.data?.zone?._id) {
          setMenuError('No kitchens available for your location. Please add a delivery address.');
          setRequiresAddress(true);
          setIsLoadingMenu(false);
          return;
        }

        const zoneId = zoneResponse.data.zone._id;
        console.log('[HomeScreen] Zone found:', zoneId);

        // Step 1b: Get kitchens for the zone
        kitchensResponse = await apiService.getKitchensForZone(zoneId, 'MEAL_MENU');
      } else if (!addressId) {
        // If no address and no location, user needs to add one
        setRequiresAddress(true);
        setIsLoadingMenu(false);
        return;
      } else {
        // Step 1: Get kitchens for the address
        kitchensResponse = await apiService.getAddressKitchens(addressId, 'MEAL_MENU');
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
      setDeliveryAddressId(addressId);

      // Step 2: Get menu for the kitchen
      const menuResponse = await apiService.getKitchenMenu(selectedKitchen._id, 'MEAL_MENU');

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
            count: 1,
          }));
          setAddOns(apiAddons);
        } else {
          console.log('[HomeScreen] No addons available for this meal');
          setAddOns([]);
        }
      }
    } catch (error: any) {
      console.error('Error fetching menu:', error);
      setMenuError(error.message || 'Failed to load menu');
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

  // Update addons when meal type changes
  useEffect(() => {
    if (menuData) {
      const currentMealItem = selectedMeal === 'lunch' ? menuData.lunch : menuData.dinner;
      if (currentMealItem?.addonIds && currentMealItem.addonIds.length > 0) {
        const apiAddons: AddOn[] = currentMealItem.addonIds.map((addon: AddonItem) => ({
          id: addon._id,
          name: addon.name,
          image: require('../../assets/images/homepage/roti.png'),
          quantity: addon.description || '1 serving',
          price: addon.price,
          selected: false,
          count: 1,
        }));
        setAddOns(apiAddons);
      } else {
        setAddOns([]);
      }
    }
  }, [selectedMeal, menuData]);

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
    return mealItem?.discountedPrice || mealItem?.price || 119;
  };

  // Helper to check if ID is a valid MongoDB ObjectId (24-character hex string)
  const isValidObjectId = (id: string): boolean => {
    return /^[a-fA-F0-9]{24}$/.test(id);
  };

  // Helper to update cart with current meal and addons
  const updateCartWithAddons = (updatedAddOns: AddOn[]) => {
    const mealItem = getCurrentMealItem();
    const mealPrice = getMealPrice();
    const mealName = mealItem?.name || `${selectedMeal === 'lunch' ? 'Lunch' : 'Dinner'} Thali`;
    const mealWindowValue = selectedMeal === 'lunch' ? 'LUNCH' : 'DINNER';

    // Check if we have a valid meal item ID from the API
    const mealItemId = mealItem?._id;
    if (!mealItemId || !isValidObjectId(mealItemId)) {
      console.warn('[HomeScreen] Invalid or missing meal item ID:', mealItemId);
      // Still allow cart to be created but warn about potential issues
    }

    // Set cart context for order creation
    setMenuType('MEAL_MENU');
    setMealWindow(mealWindowValue);

    // Build addons array - only include addons with valid MongoDB ObjectIds
    const selectedAddons = updatedAddOns
      .filter(item => item.selected && isValidObjectId(item.id))
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
      id: mealItemId || `meal-${selectedMeal}`, // Use actual _id from API
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
    const updatedAddOns = addOns.map(item =>
      item.id === id ? { ...item, selected: !item.selected } : item
    );

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
        const newCount = increment ? item.count + 1 : Math.max(1, item.count - 1);
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
    const mealPrice = getMealPrice();
    const mealName = mealItem?.name || `${selectedMeal === 'lunch' ? 'Lunch' : 'Dinner'} Thali`;
    const mealWindow = selectedMeal === 'lunch' ? 'LUNCH' : 'DINNER';

    // Set cart context for order creation
    setMenuType('MEAL_MENU');
    setMealWindow(mealWindow);

    // Build addons array for the meal item
    const selectedAddons = addOns
      .filter(item => item.selected)
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
      id: mealItem?._id || `meal-${selectedMeal}`,
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
    if (increment) {
      setMealQuantity(prev => prev + 1);
    } else {
      setMealQuantity(prev => Math.max(1, prev - 1));
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
    return mealItem?.name || 'Special Thali';
  };

  // Get meal description
  const getMealDescription = (): string => {
    const mealItem = getCurrentMealItem();
    return mealItem?.description || 'Lorem ipsum dolor sit amet consectetur. Adipiscing ultricies dui morbi varius ac id. Lorem ipsum dolor sit amet consectetur.';
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
            style={{ position: 'absolute', top: -90, right: -125, width: 300, height: 380 }}
            resizeMode="contain"
          />
          <Image
            source={require('../../assets/images/homepage/halfline.png')}
            style={{ position: 'absolute', top: 30, right: -150, width: 380, height: 150 }}
            resizeMode="contain"
          />

          <View className="flex-row items-center justify-between px-5 pt-4 pb-6">
            {/* Notification Bell */}
            <TouchableOpacity className="w-12 h-12  items-center justify-center" style={{ marginLeft: 10, marginTop: 10 }}>
              <Image
                source={require('../../assets/icons/Tiffsy.png')}
                style={{ width: 58, height: 35 }}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Location */}
            <TouchableOpacity
              className="flex-1 items-center"
              onPress={() => navigation.navigate('Address')}
            >
              <Text className="text-white text-xs opacity-90">Location</Text>
              <View className="flex-row items-center">
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
                      style={{ width: 14, height: 14, tintColor: 'white' }}
                      resizeMode="contain"
                    />
                    <Text className="text-white text-sm font-semibold ml-1" numberOfLines={1}>
                      {getDisplayLocation()}
                    </Text>
                    <Image
                      source={require('../../assets/icons/down2.png')}
                      style={{ width: 12, height: 12, marginLeft: 4, tintColor: 'white' }}
                      resizeMode="contain"
                    />
                  </>
                )}
              </View>
            </TouchableOpacity>

            {/* Voucher Button */}
            <TouchableOpacity
              onPress={() => navigation.navigate('MealPlans')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'white',
                borderRadius: 20,
                paddingVertical: 6,
                paddingHorizontal: 10,
                gap: 6,
              }}
            >
              <Image
                source={require('../../assets/icons/voucher5.png')}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#F56B4C' }}>
                {usableVouchers}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="mx-5 bg-white rounded-full flex-row items-center px-5 py-1">
            <Image
              source={require('../../assets/icons/search2.png')}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
            />
            <TextInput
              placeholder="Search for addons to your meal..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-gray-700 text-sm ml-2"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text className="text-gray-400 text-lg">×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* White Container with Meal Options and Image */}
        <View className="mb-6" style={{ position: 'relative', overflow: 'hidden', marginTop: -30 }}>
          {/* Background Image */}
          <Image
            source={require('../../assets/images/homepage/homebackground.png')}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
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
              <View style={{ height: 80, width: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
                <Image
                  source={require('../../assets/images/homepage/lunch1.png')}
                  style={{
                    width: selectedMeal === 'lunch' ? 80 : 64,
                    height: selectedMeal === 'lunch' ? 80 : 64,
                  }}
                  resizeMode="contain"
                />
              </View>
              <Text
                className={`text-base font-semibold ${
                  selectedMeal === 'lunch' ? 'text-orange-400' : 'text-gray-400'
                }`}
              >
                Lunch
              </Text>
              {selectedMeal === 'lunch' && (
                <Image
                  source={require('../../assets/icons/borderline.png')}
                  style={{ width: 100, height: 8, marginTop: 4 }}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedMeal('dinner')}
              className={`items-center mx-6 ${selectedMeal === 'dinner' ? '' : 'opacity-50'}`}
            >
              <View style={{ height: 80, width: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
                <Image
                  source={require('../../assets/images/homepage/dinner1.png')}
                  style={{
                    width: selectedMeal === 'dinner' ? 80 : 64,
                    height: selectedMeal === 'dinner' ? 80 : 64,
                  }}
                  resizeMode="contain"
                />
              </View>
              <Text
                className={`text-base font-semibold ${
                  selectedMeal === 'dinner' ? 'text-orange-400' : 'text-gray-400'
                }`}
              >
                Dinner
              </Text>
              {selectedMeal === 'dinner' && (
                <Image
                  source={require('../../assets/icons/borderline.png')}
                  style={{ width: 100, height: 8, marginTop: 4 }}
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
              style={{ width: 380, height: 380, alignSelf: 'center', marginLeft: 20 }}
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

          {/* Special Thali and Add to Cart */}
          {!isLoadingMenu && !menuError && !requiresAddress && (
          <>
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">{getMealName()}</Text>
              <Text className="text-base text-gray-600 mt-1">
                From: <Text className="font-semibold text-gray-900">₹{getMealPrice().toFixed(2)}</Text>
              </Text>
            </View>
            {!showCartModal ? (
              <TouchableOpacity
                onPress={handleAddToCart}
                activeOpacity={0.7}
                style={{
                  backgroundColor: 'rgba(245, 107, 76, 1)',
                  borderRadius: 30,
                  width: 150,
                  height: 45,
                  paddingHorizontal: 24,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: 45,
                    height: 45,
                    borderRadius: 28,
                    backgroundColor: 'rgba(255, 148, 92, 1)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: -24,
                  }}
                >
                  <Image
                    source={require('../../assets/icons/cart3.png')}
                    style={{ width: 20, height: 20, tintColor: 'rgba(255, 255, 255, 1)' }}
                    resizeMode="contain"
                  />
                </View>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', marginLeft: 12}}>Add to Cart</Text>
              </TouchableOpacity>
            ) : (
              <View
                style={{
                  backgroundColor: 'white',
                  borderRadius: 30,
                  height: 40,
                  paddingHorizontal: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minWidth: 70,
                  borderWidth: 1,
                  borderColor: 'rgba(232, 235, 234, 1)',
                }}
              >
                <TouchableOpacity
                  onPress={() => updateMealQuantity(false)}
                  style={{
                    width: 28,
                    height: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image
                    source={require('../../assets/icons/subtract.png')}
                    style={{ width: 10, height: 10 }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <Text style={{ color: 'rgba(0, 0, 0, 1)', fontSize: 16, fontWeight: '600', marginHorizontal: 8 }}>{mealQuantity}</Text>
                <TouchableOpacity
                  onPress={() => updateMealQuantity(true)}
                  style={{
                    width: 28,
                    height: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image
                    source={require('../../assets/icons/plus.png')}
                    style={{ width: 30, height: 32 }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Details Section */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-3">Details</Text>
            <Text className="text-gray-600 leading-6">
              {getMealDescription()}
            </Text>
            {getCurrentMealItem()?.includes && getCurrentMealItem()!.includes!.length > 0 && (
              <View className="mt-3">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Includes:</Text>
                <View className="flex-row flex-wrap">
                  {getCurrentMealItem()!.includes!.map((item, index) => (
                    <View key={index} className="bg-orange-50 px-3 py-1 rounded-full mr-2 mb-2">
                      <Text className="text-orange-600 text-sm">{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Add-ons Section */}
          <View>
            <Text className="text-xl font-bold text-gray-900 mb-4">Add-ons</Text>

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
                      style={{ width: 56, height: 56, borderRadius: 28 }}
                      resizeMode="cover"
                    />
                    <View className="ml-4 flex-1">
                      <Text className="text-base font-semibold text-gray-900">
                        {item.name}
                      </Text>
                      <Text className="text-sm text-gray-500 mt-0.5">
                        {item.quantity} <Text className="font-semibold text-gray-900">+ ₹{item.price}.00</Text>
                      </Text>
                    </View>
                  </View>

                  {/* Quantity Controls and Checkbox */}
                  <View className="flex-row items-center">
                    {item.selected && (
                      <View className="flex-row items-center mr-3">
                        <TouchableOpacity
                          onPress={() => updateQuantity(item.id, false)}
                          className="w-7 h-7 rounded-full border-2 border-orange-400 items-center justify-center"
                        >
                          <Text className="text-orange-400 font-bold">−</Text>
                        </TouchableOpacity>
                        <Text className="mx-3 text-base font-semibold">{item.count}x</Text>
                        <TouchableOpacity
                          onPress={() => updateQuantity(item.id, true)}
                          className="w-7 h-7 rounded-full border-2 border-orange-400 items-center justify-center"
                        >
                          <Text className="text-orange-400 font-bold">+</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <TouchableOpacity
                      onPress={() => toggleAddOn(item.id)}
                      className={`w-6 h-6 rounded border-2 items-center justify-center ${
                        item.selected ? 'bg-orange-400 border-orange-400' : 'border-gray-300'
                      }`}
                    >
                      {item.selected && <Text className="text-white font-bold text-xs">✓</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View className="py-10 items-center">
                <Text className="text-gray-400 text-base">No items found</Text>
                <Text className="text-gray-400 text-sm mt-2">Try searching for something else</Text>
              </View>
            )}
          </View>
          </>
          )}

          {/* Bottom Spacing for Navigation Bar and Cart Popup */}
          <View style={{ height: showCartModal ? 100 : 80 }} />
        </View>
      </ScrollView>

      {/* Cart Popup - Sticky at bottom */}
      {showCartModal && (
        <View
          className="absolute left-5 right-5 bg-white rounded-full px-5 py-3 flex-row items-center justify-between"
          style={{
            bottom: 80,
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
              style={{ width: 48, height: 48, borderRadius: 24 }}
              resizeMode="cover"
            />
            <View className="ml-3 flex-1" style={{ marginRight: 10 }}>
              <Text className="text-base font-bold text-gray-900" numberOfLines={1}>{getMealName()}</Text>
              <Text className="text-xs text-gray-500 mt-0.5">
                {getSelectedAddOnsCount()} Add-ons
              </Text>
            </View>
          </View>

          {/* View Cart Button */}
          <TouchableOpacity
            className="bg-orange-400 rounded-full px-5 py-2.5 flex-row items-center"
            onPress={() => navigation.navigate('Cart')}
          >
            <Image
              source={require('../../assets/icons/cart3.png')}
              style={{ width: 18, height: 18, tintColor: 'white', marginRight: 6 }}
              resizeMode="contain"
            />
            <Text className="text-white text-sm font-semibold">View Cart</Text>
          </TouchableOpacity>

          {/* Close Button */}
          <TouchableOpacity
            onPress={() => setShowCartModal(false)}
            className="w-8 h-8 items-center justify-center"
            style={{ marginRight: -12 }}
          >
            <Text className="text-gray-500 text-2xl">×</Text>
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

      {/* White background for bottom safe area */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: 'white' }} />

      {/* Bottom Navigation Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 10,
          left: 20,
          right: 20,
          backgroundColor: 'white',
          borderRadius: 50,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 6,
          paddingLeft: 20,
          paddingRight: 30,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {/* Home Icon */}
        <TouchableOpacity
          onPress={() => setActiveTab('home')}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: activeTab === 'home' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: activeTab === 'home' ? 16 : 8,
            marginLeft: -8,
            marginRight: 4,
          }}
        >
          <Image
            source={require('../../assets/icons/house.png')}
            style={{
              width: 24,
              height: 24,
              tintColor: activeTab === 'home' ? '#F56B4C' : '#9CA3AF',
              marginRight: activeTab === 'home' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {activeTab === 'home' && (
            <Text style={{ color: '#F56B4C', fontSize: 15, fontWeight: '600' }}>
              Home
            </Text>
          )}
        </TouchableOpacity>

        {/* Orders Section */}
        <TouchableOpacity
          onPress={() => {
            setActiveTab('orders');
            navigation.navigate('YourOrders');
          }}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: activeTab === 'orders' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: activeTab === 'orders' ? 16 : 8,
            marginHorizontal: 4,
          }}
        >
          <Image
            source={require('../../assets/icons/cart3.png')}
            style={{
              width: 24,
              height: 24,
              tintColor: activeTab === 'orders' ? '#F56B4C' : '#9CA3AF',
              marginRight: activeTab === 'orders' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {activeTab === 'orders' && (
            <Text style={{ color: '#F56B4C', fontSize: 15, fontWeight: '600' }}>
              Orders
            </Text>
          )}
        </TouchableOpacity>

        {/* On-Demand Icon */}
        <TouchableOpacity
          onPress={() => {
            console.log('[HomeScreen] On-Demand button pressed, navigating to OnDemand');
            setActiveTab('meals');
            navigation.navigate('OnDemand');
          }}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: activeTab === 'meals' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: activeTab === 'meals' ? 16 : 8,
            marginHorizontal: 4,
          }}
        >
          <Image
            source={require('../../assets/icons/kitchen.png')}
            style={{
              width: 24,
              height: 24,
              tintColor: activeTab === 'meals' ? '#F56B4C' : '#9CA3AF',
              marginRight: activeTab === 'meals' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {activeTab === 'meals' && (
            <Text style={{ color: '#F56B4C', fontSize: 15, fontWeight: '600' }}>
              On-Demand
            </Text>
          )}
        </TouchableOpacity>

        {/* Profile Button */}
        <TouchableOpacity
          onPress={() => {
            setActiveTab('profile');
            navigation.navigate('Account');
          }}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: activeTab === 'profile' ? 'rgba(255, 245, 242, 1)' : 'transparent',
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: activeTab === 'profile' ? 16 : 8,
            marginHorizontal: 4,
          }}
        >
          <Image
            source={require('../../assets/icons/profile2.png')}
            style={{
              width: 24,
              height: 24,
              tintColor: activeTab === 'profile' ? '#F56B4C' : '#9CA3AF',
              marginRight: activeTab === 'profile' ? 6 : 0,
            }}
            resizeMode="contain"
          />
          {activeTab === 'profile' && (
            <Text style={{ color: '#F56B4C', fontSize: 15, fontWeight: '600' }}>
              Profile
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
