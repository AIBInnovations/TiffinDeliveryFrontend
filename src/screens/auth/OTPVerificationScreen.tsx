// src/screens/auth/OTPVerificationScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthScreenProps } from '../../types/navigation';
import { useUser } from '../../context/UserContext';
import { useAlert } from '../../context/AlertContext';

type Props = AuthScreenProps<'OTPVerification'>;

const OTPVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phoneNumber, confirmation } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Verifying...');

  const { verifyOTP, loginWithPhone } = useUser();
  const { showAlert } = useAlert();

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

  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    if (code.length !== 6) {
      showAlert('Error', 'Please enter complete 6-digit OTP', undefined, 'error');
      return;
    }

    setLoading(true);
    setLoadingMessage('Verifying OTP...');

    try {
      const { isOnboarded } = await verifyOTP(confirmation, code);

      // Show checking profile message
      setLoadingMessage('Checking your profile...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Show different message based on profile status
      if (isOnboarded) {
        setLoadingMessage('Welcome back!');
        // For returning users, wait longer to ensure smooth transition to home
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        setLoadingMessage('Setting up your account...');
        // For new users, shorter delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Navigation is handled automatically by AppNavigator based on state changes
      // - If user is onboarded: AppNavigator shows MainNavigator
      // - If user needs onboarding: AppNavigator shows UserOnboarding screen
      // Keep loading true to prevent UI flash during transition
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      showAlert(
        'Error',
        error.message || 'Invalid OTP. Please try again.',
        undefined,
        'error'
      );
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setLoading(false);
    }
    // Don't set loading to false on success - let AppNavigator handle the transition
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    try {
      const newConfirmation = await loginWithPhone(phoneNumber);
      // Update route params with new confirmation
      route.params.confirmation = newConfirmation;
      setTimer(30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      showAlert('Success', 'OTP resent successfully', undefined, 'success');
    } catch (error: any) {
      console.error('Error resending OTP:', error);
      showAlert('Error', 'Failed to resend OTP. Please try again.', undefined, 'error');
    }
  };

  const handleGetStarted = async () => {
    await handleVerifyOTP();
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
              disabled={loading}
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
                opacity: loading ? 0.5 : 1,
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
                marginBottom: 10,
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
          </View>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 30,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <ActivityIndicator size="large" color="#F56B4C" style={{ marginBottom: 16 }} />
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#111827',
                marginBottom: 8,
              }}
            >
              {loadingMessage}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#6B7280',
                textAlign: 'center',
              }}
            >
              Please wait...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default OTPVerificationScreen;