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

type Props = StackScreenProps<MainTabParamList, 'HelpSupport'>;

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const HelpSupportScreen: React.FC<Props> = ({ navigation }) => {
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
          className="w-10 h-10 rounded-full bg-orange-400 items-center justify-center"
        >
          <Image
            source={require('../../assets/icons/backarrow2.png')}
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <Text className="text-xl font-bold text-gray-900">Help & Support</Text>

        <TouchableOpacity className="w-10 h-10 items-center justify-center">
          <Image
            source={require('../../assets/icons/edit3.png')}
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View className="px-5 py-4 bg-white">
          <View
            className="flex-row items-center bg-gray-50 rounded-full border border-gray-200"
            style={{ paddingHorizontal: 16, height: 46 }}
          >
            <Image
              source={require('../../assets/icons/search2.png')}
              style={{ width: 20, height: 20, tintColor: '#F97316' }}
              resizeMode="contain"
            />
            <TextInput
              placeholder="Search for an address"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-base text-gray-900"
            />
          </View>
        </View>

        {/* Contact Us Section */}
        <View className="px-5 py-4 bg-white">
          <Text className="text-xl font-bold text-gray-900 mb-4">Contact Us</Text>

          <View className="flex-row justify-between">
            {/* Call Us Card */}
            <TouchableOpacity
              onPress={handleCall}
              className="flex-1 bg-white rounded-2xl p-5 mr-2 items-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <View className="w-14 h-14 rounded-full bg-orange-50 items-center justify-center mb-3">
                <Image
                  source={require('../../assets/icons/call3.png')}
                  style={{ width: 36, height: 36 }}
                  resizeMode="contain"
                />
              </View>
              <Text className="text-base font-bold text-gray-900 mb-1">Call us</Text>
              <Text className="text-sm font-semibold text-gray-900 mb-1">+91 98765-43210</Text>
              <Text className="text-xs text-gray-500">Mon-Fri • 9-10</Text>
            </TouchableOpacity>

            {/* Email Us Card */}
            <TouchableOpacity
              onPress={handleEmail}
              className="flex-1 bg-white rounded-2xl p-5 ml-2 items-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <View className="w-14 h-14 rounded-full bg-orange-50 items-center justify-center mb-3">
                <Image
                  source={require('../../assets/icons/mail3.png')}
                  style={{ width: 36, height: 36 }}
                  resizeMode="contain"
                />
              </View>
              <Text className="text-base font-bold text-gray-900 mb-1">Email Us</Text>
              <Text className="text-sm font-semibold text-gray-900 mb-1">info@tiffindabba.in</Text>
              <Text className="text-xs text-gray-500">Mon-Fri • 9-10</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View className="px-5 py-4 bg-white mt-2">
          <Text className="text-xl font-bold text-gray-900 mb-4">
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
                className={`mr-2 px-5 py-2 rounded-full ${
                  selectedCategory === category
                    ? 'bg-orange-400'
                    : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedCategory === category
                      ? 'text-white'
                      : 'text-gray-600'
                  }`}
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
                className="bg-white rounded-2xl p-4"
                style={{
                  marginBottom: index < filteredFAQs.length - 1 ? 8 : 0,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 text-base font-semibold text-gray-900 mr-3">
                    {faq.question}
                  </Text>
                  <Image
                    source={require('../../assets/icons/downarrow.png')}
                    style={{
                      width: 20,
                      height: 20,
                      transform: [{ rotate: expandedFAQ === faq.id ? '180deg' : '0deg' }],
                    }}
                    resizeMode="contain"
                  />
                </View>

                {expandedFAQ === faq.id && (
                  <Text className="text-sm text-gray-600 mt-3 leading-5">
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
