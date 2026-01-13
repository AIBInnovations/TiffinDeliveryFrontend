// src/components/OrderSuccessModal.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Image } from 'react-native';

interface OrderSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  onGoHome: () => void;
  onTrackOrder: () => void;
  orderNumber?: string;
  amountToPay?: number;
}

const { height } = Dimensions.get('window');

const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  visible,
  onClose,
  onGoHome,
  onTrackOrder,
  orderNumber,
  amountToPay,
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            opacity: fadeAnim,
          }}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'white',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingHorizontal: 20,
                paddingTop: 30,
                paddingBottom: 30,
                transform: [{ translateY: slideAnim }],
              }}
            >
              {/* Handle Bar */}
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: '#D1D5DB',
                  borderRadius: 2,
                  alignSelf: 'center',
                  position: 'absolute',
                  top: 12,
                }}
              />

              {/* Success Icon */}
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Image
                  source={require('../assets/icons/success.png')}
                  style={{ width: 100, height: 100 }}
                  resizeMode="contain"
                />
              </View>

              {/* Success Text */}
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: '#111827',
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                Order Successful!
              </Text>

              {/* Order Number */}
              {orderNumber && (
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#F56B4C',
                    textAlign: 'center',
                    marginBottom: 8,
                  }}
                >
                  Order #{orderNumber}
                </Text>
              )}

              {/* Amount to Pay */}
              {amountToPay !== undefined && amountToPay > 0 && (
                <View
                  style={{
                    backgroundColor: '#FFF5F2',
                    borderRadius: 12,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    alignSelf: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#F56B4C',
                      textAlign: 'center',
                    }}
                  >
                    Amount to Pay: ₹{amountToPay.toFixed(2)}
                  </Text>
                </View>
              )}

              {/* Description */}
              <Text
                style={{
                  fontSize: 14,
                  color: '#9CA3AF',
                  textAlign: 'center',
                  marginBottom: 24,
                  lineHeight: 20,
                }}
              >
                We're preparing your food.{'\n'}
                See updates in my orders
              </Text>

              {/* Go Home Button */}
              <TouchableOpacity
                onPress={onGoHome}
                style={{
                  backgroundColor: 'rgba(245, 107, 76, 1)',
                  borderRadius: 28,
                  paddingVertical: 14,
                  paddingHorizontal: 32,
                  alignItems: 'center',
                  marginBottom: 12,
                  shadowColor: 'rgba(245, 107, 76, 1)',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: 'white',
                  }}
                >
                  Go Home
                </Text>
              </TouchableOpacity>

              {/* Track Order Button */}
              <TouchableOpacity
                onPress={onTrackOrder}
                style={{
                  borderWidth: 2,
                  borderColor: 'rgba(245, 107, 76, 1)',
                  borderRadius: 28,
                  paddingVertical: 12,
                  paddingHorizontal: 32,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: 'rgba(245, 107, 76, 1)',
                    marginRight: 4,
                  }}
                >
                  Track your order
                </Text>
                <Text style={{ fontSize: 16, color: 'rgba(245, 107, 76, 1)' }}>→</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default OrderSuccessModal;
