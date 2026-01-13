import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAddress } from '../../context/AddressContext';
import { useUser } from '../../context/UserContext';

type Step = 'pincode' | 'form' | 'not_serviceable';

const ADDRESS_LABELS = ['Home', 'Office', 'Other'];

const AddressSetupScreen: React.FC = () => {
  const { checkServiceability, createAddressOnServer, isCheckingServiceability } = useAddress();
  const { setNeedsAddressSetup, user } = useUser();

  const [step, setStep] = useState<Step>('pincode');
  const [pincode, setPincode] = useState('');
  const [serviceabilityMessage, setServiceabilityMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address form state
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    locality: '',
    city: '',
    state: '',
    contactName: user?.name || '',
    contactPhone: user?.phone?.replace('+91', '') || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCheckServiceability = async () => {
    if (pincode.length !== 6) {
      Alert.alert('Invalid Pincode', 'Please enter a valid 6-digit pincode');
      return;
    }

    const result = await checkServiceability(pincode);

    if (result.isServiceable) {
      setStep('form');
    } else {
      setServiceabilityMessage(result.message);
      setStep('not_serviceable');
    }
  };

  const handleTryAgain = () => {
    setPincode('');
    setStep('pincode');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!addressForm.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address is required';
    }
    if (!addressForm.locality.trim()) {
      newErrors.locality = 'Locality is required';
    }
    if (!addressForm.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!addressForm.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!addressForm.contactName.trim()) {
      newErrors.contactName = 'Contact name is required';
    }
    if (!addressForm.contactPhone.trim() || addressForm.contactPhone.length !== 10) {
      newErrors.contactPhone = 'Valid 10-digit phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitAddress = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createAddressOnServer({
        ...addressForm,
        pincode,
        isMain: true,
        contactPhone: '+91' + addressForm.contactPhone,
      });

      // Address created successfully, exit address setup flow
      setNeedsAddressSetup(false);
      // Navigation will be handled automatically by AppNavigator
    } catch (error: any) {
      console.error('Error creating address:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to save address. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormField = (field: string, value: string) => {
    setAddressForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderPincodeStep = () => (
    <View className="flex-1 justify-center px-5">
      <View className="items-center mb-8">
        <Text className="text-3xl mb-2">📍</Text>
        <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
          Where should we deliver?
        </Text>
        <Text className="text-gray-500 text-center">
          Enter your pincode to check if we deliver to your area
        </Text>
      </View>

      <View className="mb-6">
        <TextInput
          className="bg-gray-50 rounded-2xl px-4 py-4 text-xl text-center tracking-widest"
          style={{
            borderWidth: 1.5,
            borderColor: pincode.length === 6 ? '#10B981' : '#E5E7EB',
          }}
          placeholder="Enter 6-digit pincode"
          placeholderTextColor="#9CA3AF"
          value={pincode}
          onChangeText={(text) => setPincode(text.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>

      <TouchableOpacity
        onPress={handleCheckServiceability}
        disabled={pincode.length !== 6 || isCheckingServiceability}
        className="rounded-full py-4 items-center"
        style={{
          backgroundColor: pincode.length !== 6 || isCheckingServiceability ? '#CCCCCC' : '#F56B4C',
        }}
      >
        {isCheckingServiceability ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-base">
            Check Availability
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderNotServiceableStep = () => (
    <View className="flex-1 justify-center px-5">
      <View className="items-center mb-8">
        <Text className="text-5xl mb-4">😔</Text>
        <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
          We're not there yet!
        </Text>
        <Text className="text-gray-500 text-center mb-2">
          {serviceabilityMessage || "We don't deliver to this pincode yet."}
        </Text>
        <Text className="text-gray-400 text-center text-sm">
          Pincode: {pincode}
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleTryAgain}
        className="bg-orange-500 rounded-full py-4 items-center"
        style={{ backgroundColor: '#F56B4C' }}
      >
        <Text className="text-white font-bold text-base">
          Try Different Pincode
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderFormStep = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="px-5 py-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800 mb-1">
            Add Delivery Address
          </Text>
          <Text className="text-gray-500">
            Pincode: {pincode} - We deliver here!
          </Text>
        </View>

        {/* Address Label */}
        <View className="mb-5">
          <Text className="text-gray-700 font-semibold mb-2">
            Save As
          </Text>
          <View className="flex-row gap-2">
            {ADDRESS_LABELS.map((label) => (
              <TouchableOpacity
                key={label}
                onPress={() => updateFormField('label', label)}
                className="rounded-full px-4 py-2"
                style={{
                  backgroundColor: addressForm.label === label ? '#F56B4C' : '#F3F4F6',
                  borderWidth: 1,
                  borderColor: addressForm.label === label ? '#F56B4C' : '#E5E7EB',
                }}
              >
                <Text
                  style={{ color: addressForm.label === label ? '#FFFFFF' : '#374151' }}
                  className="font-medium"
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Address Line 1 */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Flat / House / Building <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="bg-gray-50 rounded-xl px-4 py-3"
            style={{
              borderWidth: 1,
              borderColor: errors.addressLine1 ? '#EF4444' : '#E5E7EB',
            }}
            placeholder="e.g., Flat 201, Sunrise Apartments"
            placeholderTextColor="#9CA3AF"
            value={addressForm.addressLine1}
            onChangeText={(text) => updateFormField('addressLine1', text)}
          />
          {errors.addressLine1 && (
            <Text className="text-red-500 text-xs mt-1">{errors.addressLine1}</Text>
          )}
        </View>

        {/* Address Line 2 */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Street / Area
          </Text>
          <TextInput
            className="bg-gray-50 rounded-xl px-4 py-3"
            style={{ borderWidth: 1, borderColor: '#E5E7EB' }}
            placeholder="e.g., Lane 5, MG Road"
            placeholderTextColor="#9CA3AF"
            value={addressForm.addressLine2}
            onChangeText={(text) => updateFormField('addressLine2', text)}
          />
        </View>

        {/* Landmark */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Landmark
          </Text>
          <TextInput
            className="bg-gray-50 rounded-xl px-4 py-3"
            style={{ borderWidth: 1, borderColor: '#E5E7EB' }}
            placeholder="e.g., Near Central Mall"
            placeholderTextColor="#9CA3AF"
            value={addressForm.landmark}
            onChangeText={(text) => updateFormField('landmark', text)}
          />
        </View>

        {/* Locality */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Locality <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="bg-gray-50 rounded-xl px-4 py-3"
            style={{
              borderWidth: 1,
              borderColor: errors.locality ? '#EF4444' : '#E5E7EB',
            }}
            placeholder="e.g., Koregaon Park"
            placeholderTextColor="#9CA3AF"
            value={addressForm.locality}
            onChangeText={(text) => updateFormField('locality', text)}
          />
          {errors.locality && (
            <Text className="text-red-500 text-xs mt-1">{errors.locality}</Text>
          )}
        </View>

        {/* City and State */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-gray-700 font-semibold mb-2">
              City <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="bg-gray-50 rounded-xl px-4 py-3"
              style={{
                borderWidth: 1,
                borderColor: errors.city ? '#EF4444' : '#E5E7EB',
              }}
              placeholder="City"
              placeholderTextColor="#9CA3AF"
              value={addressForm.city}
              onChangeText={(text) => updateFormField('city', text)}
            />
            {errors.city && (
              <Text className="text-red-500 text-xs mt-1">{errors.city}</Text>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-gray-700 font-semibold mb-2">
              State <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="bg-gray-50 rounded-xl px-4 py-3"
              style={{
                borderWidth: 1,
                borderColor: errors.state ? '#EF4444' : '#E5E7EB',
              }}
              placeholder="State"
              placeholderTextColor="#9CA3AF"
              value={addressForm.state}
              onChangeText={(text) => updateFormField('state', text)}
            />
            {errors.state && (
              <Text className="text-red-500 text-xs mt-1">{errors.state}</Text>
            )}
          </View>
        </View>

        {/* Contact Name */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Contact Name <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className="bg-gray-50 rounded-xl px-4 py-3"
            style={{
              borderWidth: 1,
              borderColor: errors.contactName ? '#EF4444' : '#E5E7EB',
            }}
            placeholder="Name for delivery"
            placeholderTextColor="#9CA3AF"
            value={addressForm.contactName}
            onChangeText={(text) => updateFormField('contactName', text)}
            autoCapitalize="words"
          />
          {errors.contactName && (
            <Text className="text-red-500 text-xs mt-1">{errors.contactName}</Text>
          )}
        </View>

        {/* Contact Phone */}
        <View className="mb-6">
          <Text className="text-gray-700 font-semibold mb-2">
            Contact Phone <Text className="text-red-500">*</Text>
          </Text>
          <View className="flex-row items-center">
            <View className="bg-gray-100 rounded-l-xl px-3 py-3 border border-r-0 border-gray-200">
              <Text className="text-gray-600 font-medium">+91</Text>
            </View>
            <TextInput
              className="flex-1 bg-gray-50 rounded-r-xl px-4 py-3"
              style={{
                borderWidth: 1,
                borderLeftWidth: 0,
                borderColor: errors.contactPhone ? '#EF4444' : '#E5E7EB',
              }}
              placeholder="10-digit phone number"
              placeholderTextColor="#9CA3AF"
              value={addressForm.contactPhone}
              onChangeText={(text) => updateFormField('contactPhone', text.replace(/[^0-9]/g, ''))}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
          {errors.contactPhone && (
            <Text className="text-red-500 text-xs mt-1">{errors.contactPhone}</Text>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmitAddress}
          disabled={isSubmitting}
          className="rounded-full py-4 items-center mb-4"
          style={{
            backgroundColor: isSubmitting ? '#CCCCCC' : '#F56B4C',
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">
              Save Address & Continue
            </Text>
          )}
        </TouchableOpacity>

        {/* Change Pincode */}
        <TouchableOpacity
          onPress={handleTryAgain}
          disabled={isSubmitting}
          className="py-3 items-center"
        >
          <Text className="text-gray-500 text-sm">
            Change Pincode
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {step === 'pincode' && renderPincodeStep()}
        {step === 'not_serviceable' && renderNotServiceableStep()}
        {step === 'form' && renderFormStep()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddressSetupScreen;
