// src/screens/account/BulkOrdersScreen.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { MainTabParamList } from '../../types/navigation';

type Props = StackScreenProps<MainTabParamList, 'BulkOrders'>;

const BulkOrdersScreen: React.FC<Props> = ({ navigation }) => {

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View className="px-5 py-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-orange-400 items-center justify-center"
        >
          <Image
            source={require('../../assets/icons/backarrow2.png')}
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <Text className="text-xl font-bold text-gray-900">Bulk Orders</Text>

        <View className="w-10 h-10" />
      </View>

      {/* Coming Soon Message */}
      <View className="flex-1 items-center justify-center px-8">
        <Image
          source={require('../../assets/icons/bulkorders.png')}
          style={{ width: 80, height: 80, marginBottom: 24 }}
          resizeMode="contain"
        />
        <Text className="text-3xl font-bold text-gray-900 mb-4">
          Coming Soon
        </Text>
        <Text className="text-base text-gray-500 text-center leading-6">
          We're working hard to bring you bulk order functionality. Stay tuned for updates!
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default BulkOrdersScreen;
