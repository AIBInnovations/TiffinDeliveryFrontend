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
import { useResponsive } from '../../hooks/useResponsive';
import { SPACING, TOUCH_TARGETS } from '../../constants/spacing';
import { FONT_SIZES } from '../../constants/typography';

type Props = StackScreenProps<MainTabParamList, 'BulkOrders'>;

const BulkOrdersScreen: React.FC<Props> = ({ navigation }) => {
  const { isSmallDevice } = useResponsive();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View className="px-5 py-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="rounded-full bg-orange-400 items-center justify-center"
          style={{
            minWidth: TOUCH_TARGETS.minimum,
            minHeight: TOUCH_TARGETS.minimum,
          }}
        >
          <Image
            source={require('../../assets/icons/backarrow2.png')}
            style={{ width: SPACING.iconLg, height: SPACING.iconLg }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <Text className="font-bold text-gray-900" style={{ fontSize: isSmallDevice ? FONT_SIZES.h4 : FONT_SIZES.h3 }}>Bulk Orders</Text>

        <View style={{ minWidth: TOUCH_TARGETS.minimum, minHeight: TOUCH_TARGETS.minimum }} />
      </View>

      {/* Coming Soon Message */}
      <View className="flex-1 items-center justify-center px-8">
        <Image
          source={require('../../assets/icons/bulkorders.png')}
          style={{ width: SPACING['4xl'] * 2, height: SPACING['4xl'] * 2, marginBottom: SPACING.xl }}
          resizeMode="contain"
        />
        <Text className="font-bold text-gray-900 mb-4" style={{ fontSize: isSmallDevice ? FONT_SIZES['2xl'] : FONT_SIZES['3xl'] }}>
          Coming Soon
        </Text>
        <Text className="text-gray-500 text-center" style={{ fontSize: FONT_SIZES.base, lineHeight: FONT_SIZES.base * 1.5 }}>
          We're working hard to bring you bulk order functionality. Stay tuned for updates!
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default BulkOrdersScreen;
