// src/screens/auth/OTPVerificationScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthScreenProps } from '../../types/navigation';

type Props = AuthScreenProps<'OTPVerification'>;

const OTPVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phoneNumber } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Refs for input fields
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Start timer
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if all fields are filled
    if (newOtp.every(digit => digit !== '')) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = (otpCode?: string) => {
    const code = otpCode || otp.join('');
    if (code.length === 6) {
      // Navigate to main app
      navigation.getParent()?.navigate('Main' as never);
    }
  };

  const handleResendOTP = () => {
    if (canResend) {
      setTimer(30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleGetStarted = () => {
    // Navigate to main app regardless of OTP validation for demo purposes
    // In production, you should validate the OTP first
    navigation.getParent()?.navigate('Main' as never);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F56B4C' }}>
      <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />
      <View style={{ flex: 1 }}>
          {/* Top image / header area */}
          <View
            style={{
              height: 250,
              backgroundColor: '#F56B4C',
              paddingHorizontal: 20,
              paddingTop: 10,
            }}
          >
            {/* Back arrow in circle */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                source={require('../../assets/icons/backarrow.png')}
                style={{ width: 40, height: 40,  }}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Illustration placeholder */}
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Delivery illustration */}
              <Image
                source={require('../../assets/images/login/pana.png')}
                style={{
                  width: 200,
                  height: 170,
                }}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Bottom white card */}
          <View
            style={{
              flex: 1,
              backgroundColor: 'white',
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 15,
            }}
          >
            {/* Login / Register Switch */}
            <View
              style={{
                backgroundColor: '#F3F4F6',
                borderRadius: 100,
                flexDirection: 'row',
                padding: 4,
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'white',
                  borderRadius: 100,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    color: '#111827',
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  Login
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  borderRadius: 100,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    color: '#9CA3AF',
                    fontSize: 16,
                    fontWeight: '500',
                  }}
                >
                  Register
                </Text>
              </View>
            </View>

            {/* Verify OTP title */}
            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#111827',
                marginBottom: 8,
              }}
            >
              Verify OTP
            </Text>

            {/* Description */}
            <Text
              style={{
                fontSize: 14,
                color: '#6B7280',
                marginBottom: 20,
                lineHeight: 20,
              }}
            >
              Enter the 6-digit code sent to{'\n'}
              {phoneNumber}
            </Text>

            {/* OTP Input Fields */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              {otp.map((digit, index) => (
                <React.Fragment key={index}>
                  <TextInput
                    ref={(ref) => {
                      if (ref) {
                        inputRefs.current[index] = ref;
                      }
                    }}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    style={{
                      width: 45,
                      height: 45,
                      borderWidth: 1,
                      borderColor: digit ? 'rgba(55, 200, 127, 1)' : 'rgba(239, 239, 239, 1)',
                      borderRadius: 10,
                      textAlign: 'center',
                      fontSize: 20,
                      fontWeight: '600',
                      color: '#111827',
                      backgroundColor: 'rgba(250, 250, 252, 1)',
                    }}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                  {index === 2 && (
                    <Text style={{ color: '#D1D5DB', fontSize: 20, marginHorizontal: 4 }}>-</Text>
                  )}
                </React.Fragment>
              ))}
            </View>

            {/* Resend code text */}
            <Text
              style={{
                textAlign: 'center',
                fontSize: 14,
                color: '#6B7280',
                marginBottom: 20,
              }}
            >
              {canResend ? (
                <Text>
                  Didn't receive code?{' '}
                  <Text
                    onPress={handleResendOTP}
                    style={{ color: '#F56B4C', fontWeight: '600' }}
                  >
                    Resend
                  </Text>
                </Text>
              ) : (
                <Text>
                  Re-send code in{' '}
                  <Text style={{ color: '#F56B4C', fontWeight: '600' }}>
                    {timer}s
                  </Text>
                </Text>
              )}
            </Text>

            {/* Get Started button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleGetStarted}
              style={{
                backgroundColor: '#F56B4C',
                borderRadius: 100,
                paddingVertical: 15,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Text
                style={{ color: 'white', fontSize: 16, fontWeight: '600' }}
              >
                Get Started
              </Text>
            </TouchableOpacity>

            {/* Footer text */}
            <Text
              style={{
                fontSize: 12,
                color: '#9CA3AF',
                textAlign: 'center',
                lineHeight: 18,
                marginBottom: 15,
              }}
            >
              By signing in, you agree to{' '}
              <Text style={{ textDecorationLine: 'underline', color: '#6B7280' }}>
                Terms of Service
              </Text>
              {'\n'}and{' '}
              <Text style={{ textDecorationLine: 'underline', color: '#6B7280' }}>
                Privacy Policy
              </Text>
            </Text>

            {/* Bottom bar indicator */}
            <View
              style={{
                position: 'absolute',
                bottom: 10,
                left: 0,
                right: 0,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 120,
                  height: 4,
                  backgroundColor: '#1F2937',
                  borderRadius: 2,
                }}
              />
            </View>
          </View>
      </View>
    </SafeAreaView>
  );
};

export default OTPVerificationScreen;