// src/screens/home/HomeScreen.tsx
import React, { useState } from 'react';
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
  const [addOns, setAddOns] = useState<AddOn[]>([
    {
      id: '1',
      name: 'Roti',
      image: require('../../assets/images/homepage/mealitem.png'),
      quantity: '1 piece',
      price: 10,
      selected: false,
      count: 1,
    },
    {
      id: '2',
      name: 'Dal',
      image: require('../../assets/images/homepage/mealitem2.png'),
      quantity: '100ml',
      price: 40,
      selected: false,
      count: 1,
    },
    {
      id: '3',
      name: 'Papad',
      image: require('../../assets/images/homepage/mealitem3.png'),
      quantity: '1 piece',
      price: 15,
      selected: false,
      count: 1,
    },
    {
      id: '4',
      name: 'Raita',
      image: require('../../assets/images/homepage/mealitem4.png'),
      quantity: '100ml',
      price: 25,
      selected: false,
      count: 2,
    },
  ]);

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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-orange-400 rounded-b-[40px] pb-8">
          <View className="flex-row items-center justify-between px-5 pt-4 pb-6">
            {/* Profile Image */}
            <Image
              source={require('../../assets/images/logo.png')}
              style={{ width: 48, height: 48, borderRadius: 24 }}
            />

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
                <Text className="text-white text-xs ml-1">▼</Text>
              </View>
            </TouchableOpacity>

            {/* Notification Bell */}
            <TouchableOpacity className="w-12 h-12 bg-white rounded-full items-center justify-center">
              <Text className="text-xl">🔔</Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View className="px-5 mb-6">
            <Text className="text-white text-4xl font-bold leading-tight">
              Add extras{'\n'}to your meal
            </Text>
          </View>

          {/* Search Bar */}
          <View className="mx-5 bg-white rounded-full flex-row items-center px-5 py-1">
            <Image
              source={require('../../assets/icons/search.png')}
              style={{ width: 18, height: 18 }}
              resizeMode="contain"
            />
            <TextInput
              placeholder="Search for addons to your meal..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-gray-700 text-sm ml-2"
            />
          </View>
        </View>

        {/* Meal Type Tabs */}
        <View className="flex-row justify-center mt-6 mb-6">
          <TouchableOpacity
            onPress={() => setSelectedMeal('lunch')}
            className={`items-center mx-6 ${selectedMeal === 'lunch' ? '' : 'opacity-50'}`}
          >
            <Image
              source={require('../../assets/images/homepage/lunch2.png')}
              style={{ width: 64, height: 64, marginBottom: 8 }}
              resizeMode="contain"
            />
            <Text
              className={`text-base font-semibold ${
                selectedMeal === 'lunch' ? 'text-orange-400' : 'text-gray-400'
              }`}
            >
              Lunch
            </Text>
            {selectedMeal === 'lunch' && (
              <View className="w-full h-0.5 bg-orange-400 mt-1" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedMeal('dinner')}
            className={`items-center mx-6 ${selectedMeal === 'dinner' ? '' : 'opacity-50'}`}
          >
            <Image
              source={require('../../assets/images/homepage/dinneritem.png')}
              style={{ width: 64, height: 64, marginBottom: 8 }}
              resizeMode="contain"
            />
            <Text
              className={`text-base font-semibold ${
                selectedMeal === 'dinner' ? 'text-orange-400' : 'text-gray-400'
              }`}
            >
              Dinner
            </Text>
            {selectedMeal === 'dinner' && (
              <View className="w-full h-0.5 bg-orange-400 mt-1" />
            )}
          </TouchableOpacity>
        </View>

        {/* Main Meal Image */}
        <View className="items-center mb-6">
          <Image
            source={
              selectedMeal === 'lunch'
                ? require('../../assets/images/homepage/lunch.png')
                : require('../../assets/images/homepage/dinner.png')
            }
            style={{ width: 320, height: 320 }}
            resizeMode="contain"
          />
        </View>

        {/* Meal Info and Add to Cart */}
        <View className="bg-white mx-5 rounded-3xl px-6 py-5 mb-6" style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">Special Thali</Text>
              <Text className="text-base text-gray-600 mt-1">
                From: <Text className="font-semibold text-gray-900">₹119.00</Text>
              </Text>
            </View>
            <TouchableOpacity
              className="bg-orange-400 rounded-full px-6 py-3 flex-row items-center"
              onPress={handleAddToCart}
            >
              <Text className="text-lg mr-2">🛒</Text>
              <Text className="text-white font-semibold">Add to Cart</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cart Popup - appears below Special Thali card */}
        {showCartModal && (
          <View
            className="mx-5 mb-6 bg-white rounded-3xl px-5 py-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 10,
            }}
          >
            {/* First Row: Image, Title/Subtitle, View Cart, Close */}
            <View className="flex-row items-center justify-between mb-3">
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
                <View className="ml-3">
                  <Text className="text-base font-bold text-gray-900">Special Thali</Text>
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {getSelectedAddOnsCount()} Add-ons
                  </Text>
                </View>
              </View>

              {/* View Cart Button */}
              <TouchableOpacity
                className="bg-orange-400 rounded-full px-5 py-2 flex-row items-center mr-2"
                onPress={() => navigation.navigate('Cart')}
              >
                <Text className="text-base mr-1.5">🛒</Text>
                <Text className="text-white text-sm font-semibold">View Cart</Text>
              </TouchableOpacity>

              {/* Close Button */}
              <TouchableOpacity
                onPress={() => setShowCartModal(false)}
                className="w-7 h-7 items-center justify-center"
              >
                <Text className="text-gray-500 text-2xl">×</Text>
              </TouchableOpacity>
            </View>

            {/* Second Row: Title and Quantity Controls */}
            <View className="flex-row items-center justify-between pt-2 border-t border-gray-100">
              <Text className="text-lg font-bold text-gray-900">Special Thali</Text>

              {/* Quantity Controls */}
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => updateMealQuantity(false)}
                  className="w-7 h-7 rounded-full border border-gray-300 items-center justify-center"
                >
                  <Text className="text-gray-600 font-bold">−</Text>
                </TouchableOpacity>
                <Text className="mx-3 text-base font-semibold">{mealQuantity}</Text>
                <TouchableOpacity
                  onPress={() => updateMealQuantity(true)}
                  className="w-7 h-7 rounded-full bg-orange-400 items-center justify-center"
                >
                  <Text className="text-white font-bold">+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Selected Add-ons */}
            {addOns.filter(item => item.selected).length > 0 && (
              <View className="mt-3 pt-3 border-t border-gray-100">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Add-ons:</Text>
                {addOns.filter(item => item.selected).map((item) => (
                  <View key={item.id} className="flex-row items-center justify-between py-2">
                    <View className="flex-row items-center flex-1">
                      <Image
                        source={item.image}
                        style={{ width: 40, height: 40, borderRadius: 20 }}
                        resizeMode="cover"
                      />
                      <View className="ml-3">
                        <Text className="text-sm font-semibold text-gray-900">{item.name}</Text>
                        <Text className="text-xs text-gray-500">
                          {item.quantity} • ₹{item.price}.00
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm font-semibold text-gray-700">{item.count}x</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Details Section */}
        <View className="mx-5 mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-3">Details</Text>
          <Text className="text-gray-600 leading-6">
            Lorem ipsum dolor sit amet consectetur. Adipiscing ultricies dui morbi
            varius ac id. Lorem ipsum dolor sit amet consectetur.
          </Text>
        </View>

        {/* Add-ons Section */}
        <View className="mx-5 mb-8">
          <Text className="text-xl font-bold text-gray-900 mb-4">Add-ons</Text>

          {addOns.map((item) => (
            <View
              key={item.id}
              className="flex-row items-center justify-between py-4 border-b border-gray-100"
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
          ))}
        </View>

        {/* Bottom Spacing */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
