// src/screens/account/HelpSupportScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { MainTabParamList } from '../../types/navigation';
import { useResponsive } from '../../hooks/useResponsive';
import { SPACING, TOUCH_TARGETS } from '../../constants/spacing';
import { FONT_SIZES } from '../../constants/typography';

type Props = StackScreenProps<MainTabParamList, 'HelpSupport'>;

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const HelpSupportScreen: React.FC<Props> = ({ navigation }) => {
  const { isSmallDevice } = useResponsive();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Account', 'Delivery', 'Quality', 'Queries'];

  const faqs: FAQ[] = [
    {
      id: '1',
      question: 'What if my order is delayed?',
      answer: 'Lorem ipsum dolor sit amet consectetur. Elementum nisi sed blandit.',
      category: 'Delivery',
    },
    {
      id: '2',
      question: 'Can I pause or cancel my meal plan?',
      answer: 'Lorem ipsum dolor sit amet consectetur. Elementum nisi sed blandit.',
      category: 'Account',
    },
    {
      id: '3',
      question: 'What if I want to skip a day?',
      answer: 'Lorem ipsum dolor sit amet consectetur. Elementum nisi sed blandit.',
      category: 'Delivery',
    },
    {
      id: '4',
      question: 'How do I change my delivery address?',
      answer: 'Lorem ipsum dolor sit amet consectetur. Elementum nisi sed blandit.',
      category: 'Delivery',
    },
    {
      id: '5',
      question: 'What payment options are available?',
      answer: 'Lorem ipsum dolor sit amet consectetur. Elementum nisi sed blandit.',
      category: 'Account',
    },
    {
      id: '6',
      question: 'Where is my delivery?',
      answer: 'Lorem ipsum dolor sit amet consectetur. Elementum nisi sed blandit.',
      category: 'Delivery',
    },
    {
      id: '7',
      question: 'Can I edit or cancel my order?',
      answer: 'Lorem ipsum dolor sit amet consectetur. Elementum nisi sed blandit.',
      category: 'Account',
    },
    {
      id: '8',
      question: 'What if my order is delayed?',
      answer: 'Lorem ipsum dolor sit amet consectetur. Elementum nisi sed blandit.',
      category: 'Delivery',
    },
  ];

  const handleCall = () => {
    Linking.openURL('tel:+919876543210');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:info@tiffindabba.in');
  };

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View className="bg-white px-5 py-4 flex-row items-center justify-between">
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

        <Text className="font-bold text-gray-900" style={{ fontSize: isSmallDevice ? FONT_SIZES.h4 : FONT_SIZES.h3 }}>Help & Support</Text>

        <View style={{ minWidth: TOUCH_TARGETS.minimum, minHeight: TOUCH_TARGETS.minimum }} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View className="px-5 py-4 bg-white">
          <View
            className="flex-row items-center bg-gray-50 rounded-full border border-gray-200"
            style={{
              paddingHorizontal: SPACING.lg,
              minHeight: TOUCH_TARGETS.comfortable,
            }}
          >
            <Image
              source={require('../../assets/icons/search2.png')}
              style={{ width: SPACING.iconSize, height: SPACING.iconSize, tintColor: '#F97316' }}
              resizeMode="contain"
            />
            <TextInput
              placeholder="Search"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-gray-900"
              style={{ marginLeft: SPACING.md, fontSize: FONT_SIZES.base }}
            />
          </View>
        </View>

        {/* Contact Us Section */}
        <View className="px-5 py-4 bg-white">
          <Text className="font-bold text-gray-900 mb-4" style={{ fontSize: isSmallDevice ? FONT_SIZES.h4 : FONT_SIZES.h3 }}>Contact Us</Text>

          <View className="flex-row justify-between">
            {/* Call Us Card */}
            <TouchableOpacity
              onPress={handleCall}
              className="flex-1 bg-white rounded-2xl mr-2 items-center"
              style={{
                padding: SPACING.lg,
                minHeight: TOUCH_TARGETS.large,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <View
                className="rounded-full bg-orange-50 items-center justify-center"
                style={{
                  width: SPACING.iconXl * 1.4,
                  height: SPACING.iconXl * 1.4,
                  marginBottom: SPACING.md,
                }}
              >
                <Image
                  source={require('../../assets/icons/call3.png')}
                  style={{ width: SPACING.iconXl, height: SPACING.iconXl }}
                  resizeMode="contain"
                />
              </View>
              <Text className="font-bold text-gray-900 mb-1" style={{ fontSize: FONT_SIZES.base }}>Call us</Text>
              <Text className="font-semibold text-gray-900 mb-1" style={{ fontSize: FONT_SIZES.sm }}>+91 98765-43210</Text>
              <Text className="text-gray-500" style={{ fontSize: FONT_SIZES.xs }}>Mon-Fri • 9-10</Text>
            </TouchableOpacity>

            {/* Email Us Card */}
            <TouchableOpacity
              onPress={handleEmail}
              className="flex-1 bg-white rounded-2xl ml-2 items-center"
              style={{
                padding: SPACING.lg,
                minHeight: TOUCH_TARGETS.large,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <View
                className="rounded-full bg-orange-50 items-center justify-center"
                style={{
                  width: SPACING.iconXl * 1.4,
                  height: SPACING.iconXl * 1.4,
                  marginBottom: SPACING.md,
                }}
              >
                <Image
                  source={require('../../assets/icons/mail3.png')}
                  style={{ width: SPACING.iconXl, height: SPACING.iconXl }}
                  resizeMode="contain"
                />
              </View>
              <Text className="font-bold text-gray-900 mb-1" style={{ fontSize: FONT_SIZES.base }}>Email Us</Text>
              <Text className="font-semibold text-gray-900 mb-1" style={{ fontSize: FONT_SIZES.sm }}>info@tiffindabba.in</Text>
              <Text className="text-gray-500" style={{ fontSize: FONT_SIZES.xs }}>Mon-Fri • 9-10</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View className="px-5 py-4 bg-white mt-2">
          <Text className="font-bold text-gray-900 mb-4" style={{ fontSize: isSmallDevice ? FONT_SIZES.h4 : FONT_SIZES.h3 }}>
            Frequently Asked Questions
          </Text>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                className="mr-2 rounded-full"
                style={{
                  paddingHorizontal: SPACING.lg,
                  paddingVertical: SPACING.sm,
                  minHeight: TOUCH_TARGETS.minimum,
                  backgroundColor: selectedCategory === category ? '#F56B4C' : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  className="font-medium"
                  style={{
                    fontSize: FONT_SIZES.sm,
                    color: selectedCategory === category ? '#FFFFFF' : '#4B5563',
                  }}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* FAQ List */}
          <View>
            {filteredFAQs.map((faq, index) => (
              <TouchableOpacity
                key={faq.id}
                onPress={() => toggleFAQ(faq.id)}
                className="bg-white rounded-2xl"
                style={{
                  padding: SPACING.lg,
                  minHeight: TOUCH_TARGETS.large,
                  marginBottom: index < filteredFAQs.length - 1 ? SPACING.sm : 0,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <Text
                    className="flex-1 font-semibold text-gray-900"
                    style={{
                      fontSize: FONT_SIZES.base,
                      marginRight: SPACING.md,
                    }}
                  >
                    {faq.question}
                  </Text>
                  <Image
                    source={require('../../assets/icons/downarrow.png')}
                    style={{
                      width: SPACING.iconSize,
                      height: SPACING.iconSize,
                      transform: [{ rotate: expandedFAQ === faq.id ? '180deg' : '0deg' }],
                    }}
                    resizeMode="contain"
                  />
                </View>

                {expandedFAQ === faq.id && (
                  <Text
                    className="text-gray-600"
                    style={{
                      fontSize: FONT_SIZES.sm,
                      lineHeight: FONT_SIZES.sm * 1.5,
                      marginTop: SPACING.md,
                    }}
                  >
                    {faq.answer}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelpSupportScreen;
