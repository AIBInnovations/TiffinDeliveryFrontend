// src/screens/home/HomeScreen.tsx
import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { MainTabParamList } from '../../types/navigation';
import { useCart } from '../../context/CartContext';
import voucherApi from '../../services/voucherApi';
import { getLocationData } from '../../utils/menuStorage';
import { MenuItem as MenuItemType, Kitchen, Zone } from '../../types/menu';

type Props = StackScreenProps<MainTabParamList, 'Home'>;

type MealType = 'lunch' | 'dinner';

interface AddOn {
  id: string;
  name: string;
  image: ImageSourcePropType | null;
  imageUrl?: string;
  quantity: string;
  price: number;
  selected: boolean;
  count: number;
  category?: string;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { addToCart } = useCart();
  const [selectedMeal, setSelectedMeal] = useState<MealType>('lunch');
  const [showCartModal, setShowCartModal] = useState(false);
  const [mealQuantity, setMealQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'meals' | 'profile'>('home');

  // Voucher state
  const [voucherCount, setVoucherCount] = useState<number>(0);
  const [voucherLoading, setVoucherLoading] = useState<boolean>(true);

  // Menu item state
  const [currentMenuItem, setCurrentMenuItem] = useState<MenuItemType | null>(null);
  const [menuLoading, setMenuLoading] = useState<boolean>(true);

  // Add-ons state
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [addOnsLoading, setAddOnsLoading] = useState<boolean>(true);

  // Location data state
  const [kitchen, setKitchen] = useState<Kitchen | null>(null);
  const [zone, setZone] = useState<Zone | null>(null);
  const [pincode, setPincode] = useState<string>('');

  // Fetch voucher summary
  const fetchVoucherSummary = useCallback(async () => {
    try {
      setVoucherLoading(true);
      const response = await voucherApi.getVoucherSummary();
      if (response.success && response.data) {
        setVoucherCount(response.data.availableVouchers);
      }
    } catch (error) {
      console.log('Error fetching voucher summary:', error);
      // Keep previous value or default to 0 on error
    } finally {
      setVoucherLoading(false);
    }
  }, []);

  // Load menu data from AsyncStorage
  const loadMenuData = useCallback(async (mealType: 'lunch' | 'dinner') => {
    try {
      setMenuLoading(true);
      setAddOnsLoading(true);

      // Get location data from AsyncStorage
      const locationData = await getLocationData();

      if (!locationData) {
        console.log('⚠️ No location data found in storage');
        return;
      }

      // Set location data
      setKitchen(locationData.kitchen);
      setZone(locationData.zone);
      setPincode(locationData.pincode);

      console.log('📍 Location data loaded:', {
        pincode: locationData.pincode,
        zone: locationData.zone.name,
        kitchen: locationData.kitchen.name
      });

      // Get menu item for selected meal type
      const mealWindow = mealType === 'lunch' ? 'lunch' : 'dinner';
      const menuItem = locationData.menu.mealMenu?.[mealWindow];

      if (menuItem) {
        setCurrentMenuItem(menuItem);
        console.log(`✅ ${mealType} menu loaded:`, menuItem.name);

        // Transform addons from menu item
        if (menuItem.addonIds && menuItem.addonIds.length > 0) {
          const transformedAddons: AddOn[] = menuItem.addonIds.map((addon) => ({
            id: addon._id,
            name: addon.name,
            image: null,
            imageUrl: addon.imageUrl,
            quantity: '1 piece',
            price: addon.price,
            selected: false,
            count: 1,
            category: addon.dietaryType,
          }));
          setAddOns(transformedAddons);
          console.log(`✅ Loaded ${transformedAddons.length} addons`);
        } else {
          setAddOns([]);
          console.log('ℹ️ No addons available for this meal');
        }
      } else {
        console.log(`⚠️ No menu item found for ${mealType}`);
        setCurrentMenuItem(null);
        setAddOns([]);
      }
    } catch (error) {
      console.error('❌ Error loading menu data:', error);
    } finally {
      setMenuLoading(false);
      setAddOnsLoading(false);
    }
  }, []);

  // Reset activeTab to 'home' and fetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setActiveTab('home');
      fetchVoucherSummary();
      // Load menu data for current selected meal type
      loadMenuData(selectedMeal);
    }, [fetchVoucherSummary, loadMenuData, selectedMeal])
  );

  // Load menu data when meal type changes
  const handleMealTypeChange = useCallback((meal: MealType) => {
    setSelectedMeal(meal);
    loadMenuData(meal);
  }, [loadMenuData]);

  const toggleAddOn = (id: string) => {
    setAddOns(addOns.map(item =>
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  const updateQuantity = (id: string, increment: boolean) => {
    setAddOns(addOns.map(item => {
      if (item.id === id) {
        const newCount = increment ? item.count + 1 : Math.max(1, item.count - 1);
        return { ...item, count: newCount };
      }
      return item;
    }));
  };

  const handleAddToCart = () => {
    // Add the meal to cart
    addToCart({
      id: currentMenuItem?._id || `meal-${selectedMeal}`,
      name: currentMenuItem?.name || `${selectedMeal === 'lunch' ? 'Lunch' : 'Dinner'} Thali`,
      image: selectedMeal === 'lunch'
        ? require('../../assets/images/homepage/lunch2.png')
        : require('../../assets/images/homepage/dinneritem.png'),
      subtitle: '1 Thali',
      price: currentMenuItem?.price || 119,
      quantity: mealQuantity,
      hasVoucher: true,
      mealType: selectedMeal === 'lunch' ? 'LUNCH' : 'DINNER',
      isMenuItem: true,
    });

    // Add selected add-ons to cart
    addOns.filter(item => item.selected).forEach(item => {
      addToCart({
        id: item.id,
        name: item.name,
        image: item.imageUrl ? { uri: item.imageUrl } : item.image,
        subtitle: `${item.count} × ${item.quantity}`,
        price: item.price * item.count,
        quantity: item.count,
        isAddon: true,
      });
    });

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

  return (
    <SafeAreaView className="flex-1 bg-orange-400">
      <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />
      <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
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
                <Image
                  source={require('../../assets/icons/address3.png')}
                  style={{ width: 14, height: 14, tintColor: 'white' }}
                  resizeMode="contain"
                />
                <Text className="text-white text-sm font-semibold ml-1">
                  {zone ? `${zone.name}, ${zone.city}` : 'Loading...'}
                </Text>
                <Image
                  source={require('../../assets/icons/down2.png')}
                  style={{ width: 12, height: 12, marginLeft: 4, tintColor: 'white' }}
                  resizeMode="contain"
                />
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
              {voucherLoading ? (
                <ActivityIndicator size="small" color="#F56B4C" />
              ) : (
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#F56B4C' }}>{voucherCount}</Text>
              )}
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
              onPress={() => handleMealTypeChange('lunch')}
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
              onPress={() => handleMealTypeChange('dinner')}
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
          {/* Special Thali and Add to Cart */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1">
              {menuLoading ? (
                <ActivityIndicator size="small" color="#F56B4C" />
              ) : (
                <>
                  <Text className="text-2xl font-bold text-gray-900">
                    {currentMenuItem?.name || 'Special Thali'}
                  </Text>
                  <Text className="text-base text-gray-600 mt-1">
                    From: <Text className="font-semibold text-gray-900">
                      ₹{currentMenuItem?.price?.toFixed(2) || '119.00'}
                    </Text>
                  </Text>
                </>
              )}
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
            {menuLoading ? (
              <ActivityIndicator size="small" color="#F56B4C" />
            ) : (
              <Text className="text-gray-600 leading-6">
                {currentMenuItem?.description || currentMenuItem?.content || 'Delicious homestyle meal prepared with fresh ingredients.'}
              </Text>
            )}
          </View>

          {/* Add-ons Section */}
          <View>
            <Text className="text-xl font-bold text-gray-900 mb-4">Add-ons</Text>

            {addOnsLoading ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="large" color="#F56B4C" />
              </View>
            ) : filteredAddOns.length > 0 ? (
              filteredAddOns.map((item) => (
                <View
                  key={item.id}
                  className="flex-row items-center justify-between py-2"
                >
                  {/* Item Image and Info */}
                  <View className="flex-row items-center flex-1">
                    <Image
                      source={item.imageUrl ? { uri: item.imageUrl } : item.image || require('../../assets/images/homepage/roti.png')}
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
                <Text className="text-gray-400 text-base">No add-ons available</Text>
                <Text className="text-gray-400 text-sm mt-2">Check back later for more options</Text>
              </View>
            )}
          </View>

          {/* Bottom Spacing for Navigation Bar */}
          <View style={{ height: 50 }} />
        </View>
      </ScrollView>

      {/* Cart Popup - Sticky at bottom */}
      {showCartModal && (
        <View
          className="absolute left-5 right-5 bg-white rounded-full px-5 py-3 flex-row items-center justify-between"
          style={{
            top: 550,
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
            <View className="ml-3" style={{ marginRight: 60 }}>
              <Text className="text-base font-bold text-gray-900">
                {currentMenuItem?.name || 'Special Thali'}
              </Text>
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

      {/* White background for bottom safe area */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, backgroundColor: 'white' }} />

      {/* Bottom Navigation Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 20,
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

        {/* Meals Icon */}
        <TouchableOpacity
          onPress={() => setActiveTab('meals')}
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
              Meals
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
