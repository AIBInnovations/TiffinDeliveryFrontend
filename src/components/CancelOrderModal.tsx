// src/components/CancelOrderModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';

interface CancelOrderModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  orderNumber?: string;
  isLoading?: boolean;
  // Voucher context props
  voucherCount?: number;
  amountPaid?: number;
  mealWindow?: 'LUNCH' | 'DINNER';
  isAfterCutoff?: boolean;
}

// Helper to check if current time is after cutoff
const checkIfAfterCutoff = (mealWindow?: 'LUNCH' | 'DINNER'): boolean => {
  if (!mealWindow) return false;

  const now = new Date();
  const hours = now.getHours();

  // LUNCH cutoff: 11:00, DINNER cutoff: 21:00
  if (mealWindow === 'LUNCH' && hours >= 11) return true;
  if (mealWindow === 'DINNER' && hours >= 21) return true;

  return false;
};

const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  visible,
  onClose,
  onConfirm,
  orderNumber,
  isLoading = false,
  voucherCount = 0,
  amountPaid = 0,
  mealWindow,
  isAfterCutoff,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Determine if after cutoff (use prop if provided, otherwise calculate)
  const afterCutoff = isAfterCutoff ?? checkIfAfterCutoff(mealWindow);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setReason('');
      setError(null);
    }
  }, [visible]);

  const handleConfirm = async () => {
    // Validate reason (min 5 characters)
    if (reason.trim().length < 5) {
      setError('Please provide a reason (minimum 5 characters)');
      return;
    }

    setError(null);
    console.log('[CancelOrderModal] Confirming cancellation');
    console.log('  - Order:', orderNumber);
    console.log('  - Reason:', reason.trim());
    console.log('  - Voucher count:', voucherCount);
    console.log('  - After cutoff:', afterCutoff);
    await onConfirm(reason.trim());
  };

  // Determine message based on order type
  const getWarningContent = () => {
    if (voucherCount > 0) {
      // Voucher order
      if (afterCutoff) {
        // After cutoff - vouchers won't be restored
        return {
          isWarning: true,
          title: 'Important Warning',
          message: `Your ${voucherCount} voucher(s) will NOT be restored because the meal window has closed.${
            amountPaid > 0 ? `\n\nYour payment of Rs${amountPaid.toFixed(2)} will be refunded within 5-7 business days.` : ''
          }`,
        };
      } else {
        // Before cutoff - vouchers will be restored
        return {
          isWarning: false,
          title: 'Voucher Restoration',
          message: `${voucherCount} voucher(s) will be restored to your account.`,
        };
      }
    } else {
      // Non-voucher order
      return {
        isWarning: false,
        title: 'Cancellation Policy',
        message: amountPaid > 0
          ? `Your refund of Rs${amountPaid.toFixed(2)} will be processed within 5-7 business days.`
          : 'Are you sure you want to cancel this order?',
      };
    }
  };

  const warningContent = getWarningContent();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-900">Cancel Order?</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Text className="text-2xl text-gray-400">×</Text>
            </TouchableOpacity>
          </View>

          {/* Order Number */}
          {orderNumber && (
            <Text className="text-sm text-gray-500 mb-4">
              Order #{orderNumber}
            </Text>
          )}

          {/* Warning/Info Box */}
          <View
            className="rounded-xl p-4 mb-4"
            style={{
              backgroundColor: warningContent.isWarning ? '#FEF3C7' : '#F0FDF4',
              borderWidth: warningContent.isWarning ? 1 : 0,
              borderColor: '#F59E0B',
            }}
          >
            <View className="flex-row items-start">
              <Image
                source={require('../assets/icons/info.png')}
                style={{
                  width: 20,
                  height: 20,
                  tintColor: warningContent.isWarning ? '#D97706' : '#16A34A',
                  marginRight: 8,
                  marginTop: 2,
                }}
                resizeMode="contain"
              />
              <View className="flex-1">
                <Text
                  className="font-semibold mb-1"
                  style={{ color: warningContent.isWarning ? '#92400E' : '#166534' }}
                >
                  {warningContent.title}
                </Text>
                <Text
                  className="text-sm"
                  style={{ color: warningContent.isWarning ? '#A16207' : '#15803D', lineHeight: 20 }}
                >
                  {warningContent.message}
                </Text>
              </View>
            </View>
          </View>

          {/* Reason Input */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Reason for cancellation *
          </Text>
          <TextInput
            placeholder="Please tell us why you want to cancel..."
            placeholderTextColor="#9CA3AF"
            value={reason}
            onChangeText={(text) => {
              setReason(text);
              if (error) setError(null);
            }}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={500}
            className="bg-gray-100 rounded-xl p-4 text-gray-900 mb-1"
            style={{ minHeight: 80 }}
            editable={!isLoading}
          />
          <View className="flex-row justify-between mb-2">
            {error ? (
              <Text className="text-red-500 text-sm">{error}</Text>
            ) : (
              <View />
            )}
            <Text className="text-gray-400 text-xs">{reason.length}/500</Text>
          </View>

          {/* Buttons */}
          <View className="flex-row mt-4">
            <TouchableOpacity
              onPress={onClose}
              disabled={isLoading}
              className="flex-1 py-4 rounded-full items-center mr-2"
              style={{ borderWidth: 2, borderColor: '#D1D5DB' }}
            >
              <Text className="font-bold text-base text-gray-600">
                Go Back
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              disabled={isLoading || reason.trim().length < 5}
              className="flex-1 py-4 rounded-full items-center ml-2"
              style={{
                backgroundColor: isLoading || reason.trim().length < 5 ? '#FCA5A5' : '#EF4444',
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">Confirm Cancel</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CancelOrderModal;
