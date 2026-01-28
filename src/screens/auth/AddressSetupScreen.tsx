import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAddress } from '../../context/AddressContext';
import { useUser } from '../../context/UserContext';
import { useAlert } from '../../context/AlertContext';
import { useResponsive } from '../../hooks/useResponsive';
import { SPACING, TOUCH_TARGETS } from '../../constants/spacing';
import { FONT_SIZES } from '../../constants/typography';

const ADDRESS_LABELS = ['Home', 'Office', 'Other'];

const AddressSetupScreen: React.FC = () => {
  const { checkServiceability, createAddressOnServer } = useAddress();
  const { setNeedsAddressSetup, user, logout } = useUser();
  const { showAlert } = useAlert();
  const { isSmallDevice } = useResponsive();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address form state
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    pincode: '',
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!addressForm.pincode.trim() || addressForm.pincode.length !== 6) {
      newErrors.pincode = 'Valid 6-digit pincode is required';
    }
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
      // First check serviceability
      const serviceabilityResult = await checkServiceability(addressForm.pincode);

      if (!serviceabilityResult.isServiceable) {
        // Show error and keep the form open for editing
        showAlert(
          'Not Serviceable',
          serviceabilityResult.message || `We don't deliver to pincode ${addressForm.pincode} yet. Please try a different address.`,
          undefined,
          'error'
        );
        // Highlight the pincode field
        setErrors(prev => ({ ...prev, pincode: 'This pincode is not serviceable' }));
        setIsSubmitting(false);
        return;
      }

      // Serviceability check passed, create the address
      await createAddressOnServer({
        label: addressForm.label,
        pincode: addressForm.pincode,
        addressLine1: addressForm.addressLine1,
        addressLine2: addressForm.addressLine2,
        landmark: addressForm.landmark,
        locality: addressForm.locality,
        city: addressForm.city,
        state: addressForm.state,
        contactName: addressForm.contactName,
        contactPhone: '+91' + addressForm.contactPhone,
        isMain: true,
      });

      // Address created successfully, exit address setup flow
      setNeedsAddressSetup(false);
      // Navigation will be handled automatically by AppNavigator
    } catch (error: any) {
      console.error('Error creating address:', error);
      showAlert(
        'Error',
        error.message || 'Failed to save address. Please try again.',
        undefined,
        'error'
      );
      setIsSubmitting(false);
    }
  };

  const updateFormField = (field: string, value: string) => {
    setAddressForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBackPress = async () => {
    try {
      // Log out the user - this will automatically redirect to login screen
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
      showAlert('Error', 'Failed to log out. Please try again.', undefined, 'error');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Back Button */}
      <View className="px-5 pt-2 pb-2">
        <TouchableOpacity
          onPress={handleBackPress}
          style={{
            minWidth: TOUCH_TARGETS.minimum,
            minHeight: TOUCH_TARGETS.minimum,
            borderRadius: TOUCH_TARGETS.minimum / 2,
            backgroundColor: '#F3F4F6',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name="arrow-left" size={SPACING.iconSize} color="#374151" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-5 py-6">
            {/* Header */}
            <View className="mb-6">
              <Text className="font-bold text-gray-800 mb-1" style={{ fontSize: isSmallDevice ? FONT_SIZES.h3 : FONT_SIZES.h2 }}>
                Add Delivery Address
              </Text>
              <Text className="text-gray-500" style={{ fontSize: FONT_SIZES.base }}>
                We'll check if we deliver to your area
              </Text>
            </View>

            {/* Address Label */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2" style={{ fontSize: FONT_SIZES.base }}>
                Save As
              </Text>
              <View className="flex-row gap-2">
                {ADDRESS_LABELS.map((label) => (
                  <TouchableOpacity
                    key={label}
                    onPress={() => updateFormField('label', label)}
                    className="rounded-full"
                    style={{
                      paddingHorizontal: SPACING.lg,
                      paddingVertical: SPACING.sm,
                      minHeight: TOUCH_TARGETS.minimum,
                      backgroundColor: addressForm.label === label ? '#F56B4C' : '#F3F4F6',
                      borderWidth: 1,
                      borderColor: addressForm.label === label ? '#F56B4C' : '#E5E7EB',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: addressForm.label === label ? '#FFFFFF' : '#374151',
                        fontSize: FONT_SIZES.base,
                      }}
                      className="font-medium"
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pincode */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2" style={{ fontSize: FONT_SIZES.base }}>
                Pincode <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="bg-gray-50 rounded-xl"
                style={{
                  paddingHorizontal: SPACING.lg,
                  paddingVertical: SPACING.md,
                  minHeight: TOUCH_TARGETS.comfortable,
                  fontSize: FONT_SIZES.base,
                  borderWidth: 1,
                  borderColor: errors.pincode ? '#EF4444' : addressForm.pincode.length === 6 ? '#10B981' : '#E5E7EB',
                }}
                placeholder="Enter 6-digit pincode"
                placeholderTextColor="#9CA3AF"
                value={addressForm.pincode}
                onChangeText={(text) => updateFormField('pincode', text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={6}
              />
              {errors.pincode && (
                <Text className="text-red-500 mt-1" style={{ fontSize: FONT_SIZES.xs }}>{errors.pincode}</Text>
              )}
            </View>

            {/* Address Line 1 */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2" style={{ fontSize: FONT_SIZES.base }}>
                Flat / House / Building <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="bg-gray-50 rounded-xl"
                style={{
                  paddingHorizontal: SPACING.lg,
                  paddingVertical: SPACING.md,
                  minHeight: TOUCH_TARGETS.comfortable,
                  fontSize: FONT_SIZES.base,
                  borderWidth: 1,
                  borderColor: errors.addressLine1 ? '#EF4444' : '#E5E7EB',
                }}
                placeholder="e.g., Flat 201, Sunrise Apartments"
                placeholderTextColor="#9CA3AF"
                value={addressForm.addressLine1}
                onChangeText={(text) => updateFormField('addressLine1', text)}
              />
              {errors.addressLine1 && (
                <Text className="text-red-500 mt-1" style={{ fontSize: FONT_SIZES.xs }}>{errors.addressLine1}</Text>
              )}
            </View>

            {/* Address Line 2 */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2" style={{ fontSize: FONT_SIZES.base }}>
                Street / Area
              </Text>
              <TextInput
                className="bg-gray-50 rounded-xl"
                style={{
                  paddingHorizontal: SPACING.lg,
                  paddingVertical: SPACING.md,
                  minHeight: TOUCH_TARGETS.comfortable,
                  fontSize: FONT_SIZES.base,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}
                placeholder="e.g., Lane 5, MG Road"
                placeholderTextColor="#9CA3AF"
                value={addressForm.addressLine2}
                onChangeText={(text) => updateFormField('addressLine2', text)}
              />
            </View>

            {/* Landmark */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2" style={{ fontSize: FONT_SIZES.base }}>
                Landmark
              </Text>
              <TextInput
                className="bg-gray-50 rounded-xl"
                style={{
                  paddingHorizontal: SPACING.lg,
                  paddingVertical: SPACING.md,
                  minHeight: TOUCH_TARGETS.comfortable,
                  fontSize: FONT_SIZES.base,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}
                placeholder="e.g., Near Central Mall"
                placeholderTextColor="#9CA3AF"
                value={addressForm.landmark}
                onChangeText={(text) => updateFormField('landmark', text)}
              />
            </View>

            {/* Locality */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2" style={{ fontSize: FONT_SIZES.base }}>
                Locality <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="bg-gray-50 rounded-xl"
                style={{
                  paddingHorizontal: SPACING.lg,
                  paddingVertical: SPACING.md,
                  minHeight: TOUCH_TARGETS.comfortable,
                  fontSize: FONT_SIZES.base,
                  borderWidth: 1,
                  borderColor: errors.locality ? '#EF4444' : '#E5E7EB',
                }}
                placeholder="e.g., Koregaon Park"
                placeholderTextColor="#9CA3AF"
                value={addressForm.locality}
                onChangeText={(text) => updateFormField('locality', text)}
              />
              {errors.locality && (
                <Text className="text-red-500 mt-1" style={{ fontSize: FONT_SIZES.xs }}>{errors.locality}</Text>
              )}
            </View>

            {/* City and State */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-gray-700 font-semibold mb-2" style={{ fontSize: FONT_SIZES.base }}>
                  City <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl"
                  style={{
                    paddingHorizontal: SPACING.lg,
                    paddingVertical: SPACING.md,
                    minHeight: TOUCH_TARGETS.comfortable,
                    fontSize: FONT_SIZES.base,
                    borderWidth: 1,
                    borderColor: errors.city ? '#EF4444' : '#E5E7EB',
                  }}
                  placeholder="City"
                  placeholderTextColor="#9CA3AF"
                  value={addressForm.city}
                  onChangeText={(text) => updateFormField('city', text)}
                />
                {errors.city && (
                  <Text className="text-red-500 mt-1" style={{ fontSize: FONT_SIZES.xs }}>{errors.city}</Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 font-semibold mb-2" style={{ fontSize: FONT_SIZES.base }}>
                  State <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl"
                  style={{
                    paddingHorizontal: SPACING.lg,
                    paddingVertical: SPACING.md,
                    minHeight: TOUCH_TARGETS.comfortable,
                    fontSize: FONT_SIZES.base,
                    borderWidth: 1,
                    borderColor: errors.state ? '#EF4444' : '#E5E7EB',
                  }}
                  placeholder="State"
                  placeholderTextColor="#9CA3AF"
                  value={addressForm.state}
                  onChangeText={(text) => updateFormField('state', text)}
                />
                {errors.state && (
                  <Text className="text-red-500 mt-1" style={{ fontSize: FONT_SIZES.xs }}>{errors.state}</Text>
                )}
              </View>
            </View>

            {/* Contact Name */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2" style={{ fontSize: FONT_SIZES.base }}>
                Contact Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="bg-gray-50 rounded-xl"
                style={{
                  paddingHorizontal: SPACING.lg,
                  paddingVertical: SPACING.md,
                  minHeight: TOUCH_TARGETS.comfortable,
                  fontSize: FONT_SIZES.base,
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
                <Text className="text-red-500 mt-1" style={{ fontSize: FONT_SIZES.xs }}>{errors.contactName}</Text>
              )}
            </View>

            {/* Contact Phone */}
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2" style={{ fontSize: FONT_SIZES.base }}>
                Contact Phone <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row items-center">
                <View
                  className="bg-gray-100 rounded-l-xl border border-r-0 border-gray-200"
                  style={{
                    paddingHorizontal: SPACING.md,
                    paddingVertical: SPACING.md,
                    minHeight: TOUCH_TARGETS.comfortable,
                    justifyContent: 'center',
                  }}
                >
                  <Text className="text-gray-600 font-medium" style={{ fontSize: FONT_SIZES.base }}>+91</Text>
                </View>
                <TextInput
                  className="flex-1 bg-gray-50 rounded-r-xl"
                  style={{
                    paddingHorizontal: SPACING.lg,
                    paddingVertical: SPACING.md,
                    minHeight: TOUCH_TARGETS.comfortable,
                    fontSize: FONT_SIZES.base,
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
                <Text className="text-red-500 mt-1" style={{ fontSize: FONT_SIZES.xs }}>{errors.contactPhone}</Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmitAddress}
              disabled={isSubmitting}
              className="rounded-full items-center mb-4"
              style={{
                paddingVertical: SPACING.lg,
                minHeight: TOUCH_TARGETS.large,
                backgroundColor: isSubmitting ? '#CCCCCC' : '#F56B4C',
                justifyContent: 'center',
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold" style={{ fontSize: FONT_SIZES.base }}>
                  Save Address & Continue
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddressSetupScreen;
