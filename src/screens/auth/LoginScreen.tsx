import React, { useState } from 'react';
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

type Props = AuthScreenProps<'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [remember, setRemember] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'login' | 'register'>('login');

  const handleGetOtp = () => {
    if (phone.length >= 10) {
      navigation.navigate('OTPVerification', { phoneNumber: `+91 ${phone}` });
    }
  };

  const handleExplore = () => {
    // TODO: go straight to Main app
    // navigation.getParent()?.navigate('Main');
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
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View style={{
                width: 18,
                height: 18,
                marginBottom:5,
              }}>
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  includeFontPadding: false,
                  textAlignVertical: 'center',
                  textAlign: 'center',
                }}>←</Text>
              </View>
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
                source={require('../../assets/images/login/login.png')}
                style={{
                  width: 200,
                  height: 140,
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
              <TouchableOpacity
                onPress={() => setSelectedTab('login')}
                style={{
                  flex: 1,
                  backgroundColor: selectedTab === 'login' ? 'white' : 'transparent',
                  borderRadius: 100,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    color: selectedTab === 'login' ? '#111827' : '#9CA3AF',
                    fontSize: 16,
                    fontWeight: selectedTab === 'login' ? '600' : '500',
                  }}
                >
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedTab('register')}
                style={{
                  flex: 1,
                  backgroundColor: selectedTab === 'register' ? 'white' : 'transparent',
                  borderRadius: 100,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    color: selectedTab === 'register' ? '#111827' : '#9CA3AF',
                    fontSize: 16,
                    fontWeight: selectedTab === 'register' ? '600' : '500',
                  }}
                >
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            {/* Your Number label */}
            <Text
              style={{
                color: '#111827',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 12,
              }}
            >
              Your Number
            </Text>

            {/* Phone input */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 12,
                backgroundColor: '#F3F4F6',
                paddingHorizontal: 15,
                paddingVertical: 4,
                marginBottom: 20,
              }}
            >
              {/* Country / code */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingRight: 10,
                  borderRightWidth: 1,
                  borderRightColor: '#D1D5DB',
                  marginRight: 10,
                }}
              >
                <Text style={{ fontSize: 20 }}>🇮🇳</Text>
                <Text
                  style={{
                    marginLeft: 6,
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#111827',
                  }}
                >
                  +91
                </Text>
                <Text style={{ fontSize: 12, marginLeft: 4, color: '#6B7280' }}>▼</Text>
              </TouchableOpacity>

              {/* Phone number */}
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: '#111827',
                  paddingVertical: 12,
                }}
                placeholder="Enter the number"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                placeholderTextColor="#9CA3AF"
                maxLength={10}
              />
            </View>

            {/* Remember me */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 20,
              }}
              onPress={() => setRemember(!remember)}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: remember ? '#F56B4C' : '#D1D5DB',
                  backgroundColor: remember ? '#F56B4C' : 'white',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}
              >
                {remember && (
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
                )}
              </View>
              <Text style={{ color: '#6B7280', fontSize: 14 }}>Remember me</Text>
            </TouchableOpacity>

            {/* Get OTP button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleGetOtp}
              style={{
                backgroundColor: '#F56B4C',
                borderRadius: 100,
                paddingVertical: 15,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
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
                Get OTP
              </Text>
            </TouchableOpacity>

            {/* Divider with "or" */}
            <Text
              style={{
                textAlign: 'center',
                color: '#9CA3AF',
                marginVertical: 8,
                fontSize: 14,
              }}
            >
              or
            </Text>

            {/* Explore button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleExplore}
              style={{
                borderRadius: 100,
                paddingVertical: 15,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#F56B4C',
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  color: '#F56B4C',
                  fontSize: 16,
                  fontWeight: '600',
                }}
              >
                Explore
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

export default LoginScreen;
