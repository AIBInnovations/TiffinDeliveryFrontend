// src/screens/account/BulkOrdersScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { MainTabParamList } from '../../types/navigation';

type Props = StackScreenProps<MainTabParamList, 'BulkOrders'>;

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

const BulkOrdersScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedMeal, setSelectedMeal] = useState<MealType>('lunch');
  const [showCartModal, setShowCartModal] = useState(false);
  const [quantity, setQuantity] = useState(15);
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
      image: require('../../assets/images/raita.png'),
      quantity: '100ml',
      price: 25,
      selected: true,
      count: 1,
    },
    {
      id: '5',
      name: 'Rice',
      image: require('../../assets/icons/rice.png'),
      quantity: '100g',
      price: 35,
      selected: true,
      count: 1,
    },
  ]);

  const basePrice = 1799;

  const toggleAddOn = (id: string) => {
    setAddOns(addOns.map(item =>
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 15) {
      setQuantity(quantity - 1);
    }
  };

  const calculateTotal = () => {
    const addOnsTotal = addOns
      .filter(item => item.selected)
      .reduce((sum, item) => sum + item.price * item.count, 0);
    return basePrice + addOnsTotal;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="rgba(255, 255, 255, 1)" />

      <ScrollView className="flex-1" style={{ backgroundColor: 'rgba(255, 255, 255, 1)' }} showsVerticalScrollIndicator={false}>
        {/* Header and Tabs Container */}
        <View style={{ backgroundColor: 'rgba(255, 255, 255, 1)', position: 'relative', overflow: 'hidden' }}>
          {/* Background Image */}
          <Image
            source={require('../../assets/images/Bulkorders/bulkbg.png')}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
            resizeMode="cover"
          />

          {/* Header */}
          <View className="px-5 py-3 flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-12 h-12 rounded-full bg-orange-400 items-center justify-center"
            >
              <Image
                source={require('../../assets/icons/backarrow2.png')}
                style={{ width: 32, height: 32 }}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <Text className="text-2xl font-bold text-gray-900">Bulk Orders</Text>

            <TouchableOpacity className="w-12 h-12 rounded-full bg-orange-400 items-center justify-center">
              <Image
                source={require('../../assets/icons/edit3.png')}
                style={{ width: 32, height: 32 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Meal Type Tabs */}
          <View className="flex-row justify-center py-6">
            <TouchableOpacity
              onPress={() => setSelectedMeal('lunch')}
              className="items-center ml-2 mr-8"
            >
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
              className="items-center ml-8 mr-2"
            >
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
          <View className="items-center py-8">
            <Image
              source={
                selectedMeal === 'lunch'
                  ? require('../../assets/images/Bulkorders/bulk.png')
                  : require('../../assets/images/Bulkorders/Bulkthali.png')
              }
              style={{ width: 320, height: 320 }}
              resizeMode="contain"
            />
          </View>
        </View>
        {/* Meal Details */}
        <View className="px-6" style={{ marginTop: -60 }}>
          {/* Title and Add to Cart */}
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-2xl font-bold text-gray-900">Special Thali</Text>
              <Text className="text-sm mt-0.5" style={{ color: 'rgba(145, 145, 145, 1)' }}>Min 15 per order*</Text>
              <Text className="text-base text-gray-600 mt-3">
                From: <Text className="font-semibold text-gray-900">₹{basePrice.toFixed(2)}</Text>
              </Text>
            </View>
            <View>
              {!showCartModal ? (
                <TouchableOpacity
                  onPress={() => setShowCartModal(true)}
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
                    marginLeft: 40,
                    borderRadius: 30,
                    height: 40,
                    paddingHorizontal: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: 110,
                    borderWidth: 1,
                    borderColor: 'rgba(232, 235, 234, 1)',
                  }}
                >
                  <TouchableOpacity
                    onPress={decreaseQuantity}
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
                  <Text style={{ color: 'rgba(0, 0, 0, 1)', fontSize: 16, fontWeight: '600', marginHorizontal: 8 }}>{quantity}</Text>
                  <TouchableOpacity
                    onPress={increaseQuantity}
                    style={{
                      width: 28,
                      height: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Image
                      source={require('../../assets/icons/plus.png')}
                      style={{ width: 30, height: 32,  }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              )}
              {/* Time Info */}
              <View className="flex-row items-center mt-2" style={{ marginLeft: 55 }}>
                <Image
                  source={require('../../assets/icons/time2.png')}
                  style={{ width: 20, height: 20, marginRight: 4, tintColor: 'rgba(145, 145, 145, 1)' }}
                  resizeMode="contain"
                />
                <Text className="text-sm" style={{ color: 'rgba(145, 145, 145, 1)' }}>30-40 mins</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <Text className="text-sm text-gray-600 leading-6 mb-6">
            Lorem ipsum dolor sit amet consectetur. Adipiscing ultricies dui morbi varius ac id. Lorem ipsum dolor sit amet consectetur.
          </Text>

          {/* Add-ons Section */}
          <Text className="text-xl font-bold text-gray-900 mb-4">Add-ons</Text>

          {addOns.map((item) => (
            <View
              key={item.id}
              className="flex-row items-center justify-between py-3"
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

              {/* Checkbox */}
              <TouchableOpacity
                onPress={() => toggleAddOn(item.id)}
                className={`w-6 h-6 rounded items-center justify-center ${
                  item.selected ? 'bg-orange-400' : 'border-2 border-gray-300'
                }`}
              >
                {item.selected && <Text className="text-white font-bold text-xs">✓</Text>}
              </TouchableOpacity>
            </View>
          ))}

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>

      {/* Bottom Cart Bar */}
      {showCartModal && (
      <View
        className="absolute left-6 right-6 bg-white rounded-full px-5 py-3 flex-row items-center justify-between"
        style={{
          bottom: 30,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 10,
        }}
      >
        <View style={{ marginLeft: 5 }}>
          <Text className="text-sm text-gray-600">Total amount</Text>
          <Text className="text-xl font-bold text-gray-900">₹{calculateTotal().toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          className="flex-row items-center rounded-full px-4 py-2"
          style={{ backgroundColor: 'rgba(245, 107, 76, 1)', marginLeft: 70 }}
          onPress={() => navigation.navigate('Cart')}
        >
          <Image
            source={require('../../assets/icons/cart3.png')}
            style={{ width: 20, height: 20, marginTop: 4, marginRight: 8 }}
            resizeMode="contain"
          />
          <Text className="text-white font-bold text-base">View Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowCartModal(false)}
          className="w-8 h-8 items-center justify-center"
        >
          <Text className="text-gray-500 text-2xl">×</Text>
        </TouchableOpacity>
      </View>
      )}
    </SafeAreaView>
  );
};

export default BulkOrdersScreen;
