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
              height: 220,
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
                style={{ width: 40, height: 40, }}
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
              paddingBottom: 50,
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
                borderRadius: 19,
                backgroundColor: 'rgba(250, 250, 252, 1)',
                borderWidth: 1.5,
                borderColor: phone.length === 10 ? 'rgba(55, 200, 127, 1)' : 'rgba(239, 239, 239, 1)',
                paddingHorizontal: 15,
                paddingVertical: 4,
                marginBottom: 12,
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
                <Image
                  source={require('../../assets/icons/indianflag.png')}
                  style={{ width: 24, height: 24 }}
                  resizeMode="contain"
                />
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
                <Image
                  source={require('../../assets/icons/downarrow.png')}
                  style={{ width: 12, height: 12, marginLeft: 4 }}
                  resizeMode="contain"
                />
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
                placeholderTextColor="rgba(206, 206, 206, 1)"
                maxLength={10}
              />

              {/* Green tick icon */}
              {phone.length === 10 && (
                <Image
                  source={require('../../assets/icons/greentick.png')}
                  style={{ width: 20, height: 20, marginLeft: 8 }}
                  resizeMode="contain"
                />
              )}
            </View>

            {/* Remember me */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 30,
              }}
              onPress={() => setRemember(!remember)}
            >
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 3,
                  borderWidth: 2,
                  borderColor: remember ? 'rgba(36, 36, 36, 1)' : '#D1D5DB',
                  backgroundColor: remember ? 'white' : 'white',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}
              >
                {remember && (
                  <Text style={{ color: 'rgba(36, 36, 36, 1)', fontSize: 10, fontWeight: 'bold' }}>✓</Text>
                )}
              </View>
              <Text style={{ color: 'rgba(36, 36, 36, 1)', fontSize: 14 }}>Remember me</Text>
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
                marginBottom: 4,
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
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 16,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: '#D1D5DB',
                }}
              />
              <Text
                style={{
                  marginHorizontal: 10,
                  color: '#9CA3AF',
                  fontSize: 14,
                }}
              >
                or
              </Text>
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: '#D1D5DB',
                }}
              />
            </View>

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
                marginTop: 10,
                marginBottom: 45,
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
