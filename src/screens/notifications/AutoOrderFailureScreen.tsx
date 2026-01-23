// src/screens/notifications/AutoOrderFailureScreen.tsx
import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, Image, StatusBar } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { MainTabParamList } from '../../types/navigation';
import AutoOrderFailureModal from '../../components/AutoOrderFailureModal';

type Props = StackScreenProps<MainTabParamList, 'AutoOrderFailure'>;

/**
 * Screen wrapper for Auto-Order Failure notifications
 * Displays the failure modal with navigation back button
 */
const AutoOrderFailureScreen: React.FC<Props> = ({ navigation, route }) => {
  const { failureCategory, mealWindow, message } = route.params;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View className="bg-white px-5 py-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-orange-400 items-center justify-center"
        >
          <Image
            source={require('../../assets/icons/arrow.png')}
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-xl font-bold text-gray-900 mr-10">
          Auto-Order Failed
        </Text>
      </View>

      {/* Modal Display */}
      <AutoOrderFailureModal
        visible={true}
        failureCategory={failureCategory}
        mealWindow={mealWindow}
        message={message}
        onDismiss={() => navigation.goBack()}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

export default AutoOrderFailureScreen;
