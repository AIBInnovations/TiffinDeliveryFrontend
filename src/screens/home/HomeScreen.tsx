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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { MainTabParamList } from '../../types/navigation';
import { useCart } from '../../context/CartContext';

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

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { addToCart } = useCart();
  const [selectedMeal, setSelectedMeal] = useState<MealType>('lunch');
  const [showCartModal, setShowCartModal] = useState(false);
  const [mealQuantity, setMealQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'meals' | 'vouchers'>('home');
  const [addOns, setAddOns] = useState<AddOn[]>([
    {
      id: '1',
      name: 'Roti',
      image: require('../../assets/images/homepage/roti.png'),
      quantity: '1 piece',
      price: 10,
      selected: false,
      count: 1,
    },
    {
      id: '2',
      name: 'Dal',
      image: require('../../assets/images/homepage/dal.png'),
      quantity: '100ml',
      price: 40,
      selected: false,
      count: 1,
    },
    {
      id: '3',
      name: 'Papad',
      image: require('../../assets/images/homepage/papad.png'),
      quantity: '1 piece',
      price: 15,
      selected: false,
      count: 1,
    },
    {
      id: '4',
      name: 'Raita',
      image: require('../../assets/images/homepage/raita.png'),
      quantity: '100ml',
      price: 25,
      selected: false,
      count: 2,
    },
  ]);

  // Reset activeTab to 'home' when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setActiveTab('home');
    }, [])
  );

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
      id: `meal-${selectedMeal}`,
      name: `${selectedMeal === 'lunch' ? 'Lunch' : 'Dinner'} Thali`,
      image: selectedMeal === 'lunch'
        ? require('../../assets/images/homepage/lunch2.png')
        : require('../../assets/images/homepage/dinneritem.png'),
      subtitle: '1 Thali',
      price: 119,
      quantity: mealQuantity,
      hasVoucher: true,
    });

    // Add selected add-ons to cart
    addOns.filter(item => item.selected).forEach(item => {
      addToCart({
        id: `addon-${item.id}`,
        name: item.name,
        image: item.image,
        subtitle: `${item.count} × ${item.quantity}`,
        price: item.price * item.count,
        quantity: item.count,
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
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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
                  source={require('../../assets/icons/Vector.png')}
                  style={{ width: 14, height: 14, tintColor: 'white' }}
                  resizeMode="contain"
                />
                <Text className="text-white text-sm font-semibold ml-1">
                  Vijay Nagar, Indore
                </Text>
                <Image
                  source={require('../../assets/icons/down2.png')}
                  style={{ width: 12, height: 12, marginLeft: 4, tintColor: 'white' }}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>

            {/* Profile Image */}
            <TouchableOpacity onPress={() => navigation.navigate('Account')}>
              <Image
                source={require('../../assets/images/myaccount/user.png')}
                style={{ width: 48, height: 48, borderRadius: 24 }}
                resizeMode="cover"
              />
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
          <View className="flex-row justify-center pt-12 mb-6">
            <TouchableOpacity
              onPress={() => setSelectedMeal('lunch')}
              className={`items-center mx-6 ${selectedMeal === 'lunch' ? '' : 'opacity-50'}`}
            >
              <View style={{ height: 80, width: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
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
                  style={{ width: '100%', height: 4, marginTop: 4 }}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedMeal('dinner')}
              className={`items-center mx-6 ${selectedMeal === 'dinner' ? '' : 'opacity-50'}`}
            >
              <View style={{ height: 80, width: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
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
                  style={{ width: '100%', height: 4, marginTop: 4 }}
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
              <Text className="text-2xl font-bold text-gray-900">Special Thali</Text>
              <Text className="text-base text-gray-600 mt-1">
                From: <Text className="font-semibold text-gray-900">₹119.00</Text>
              </Text>
            </View>
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
                  source={require('../../assets/icons/proicons_cart.png')}
                  style={{ width: 20, height: 20, tintColor: 'rgba(255, 255, 255, 1)' }}
                  resizeMode="contain"
                />
              </View>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', marginLeft: 12}}>Add to Cart</Text>
            </TouchableOpacity>
          </View>

          {/* Details Section */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-3">Details</Text>
            <Text className="text-gray-600 leading-6">
              Lorem ipsum dolor sit amet consectetur. Adipiscing ultricies dui morbi
              varius ac id. Lorem ipsum dolor sit amet consectetur.
            </Text>
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
              <Text className="text-base font-bold text-gray-900">Special Thali</Text>
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
              source={require('../../assets/icons/proicons_cart.png')}
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
            navigation.navigate('Orders');
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
            source={require('../../assets/icons/proicons_cart.png')}
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
            source={require('../../assets/icons/spoons.png')}
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

        {/* Voucher Button */}
        <TouchableOpacity
          onPress={() => setActiveTab('vouchers')}
          className="flex-row items-center justify-center"
          style={{
            backgroundColor: '#F56B4C',
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: 16,
            marginLeft: 12,
            marginRight: activeTab !== 'vouchers' ? 12 : 0,
          }}
        >
          <Image
            source={require('../../assets/icons/voucher2.png')}
            style={{ width: 20, height: 20, tintColor: 'white', marginRight: 8 }}
            resizeMode="contain"
          />
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>
            12
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
