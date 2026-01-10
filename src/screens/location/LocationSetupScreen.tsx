import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  getCurrentLocationWithPincode,
  requestLocationPermission,
} from '../../services/location.service';
import { fetchMenuForPincode } from '../../services/menuFetch.service';

type NavigationProp = StackNavigationProp<any>;

const LocationSetupScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isLoading, setIsLoading] = useState(false);

  const handleUseCurrentLocation = async () => {
    setIsLoading(true);

    try {
      console.log('📍 User selected: Use Current Location');

      // Get location with pincode
      const result = await getCurrentLocationWithPincode();

      if (!result || !result.address.pincode) {
        Alert.alert(
          'Location Not Available',
          'Unable to detect your location automatically. This can happen:\n\n• If GPS is disabled\n• If you\'re indoors\n• If location services are weak\n\nPlease enter your pincode manually instead.',
          [
            {
              text: 'Enter Pincode',
              onPress: () => navigation.navigate('PincodeInput'),
            },
          ]
        );
        return;
      }

      const { pincode } = result.address;
      console.log('✅ Pincode detected:', pincode);

      // Check serviceability
      await checkServiceability(pincode);
    } catch (error: any) {
      console.error('❌ Error in location setup:', error);

      // Show user-friendly error message
      const errorMessage = error?.message || 'Failed to get location. Please try entering pincode manually.';

      Alert.alert(
        'Location Error',
        errorMessage,
        [
          {
            text: 'Enter Pincode Manually',
            onPress: () => navigation.navigate('PincodeInput'),
          },
          {
            text: 'Try Again',
            onPress: () => handleUseCurrentLocation(),
            style: 'cancel',
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterManually = () => {
    console.log('✍️ User selected: Enter Pincode Manually');
    navigation.navigate('PincodeInput');
  };

  const checkServiceability = async (pincode: string) => {
    try {
      // Use shared service for complete menu fetch flow
      const result = await fetchMenuForPincode(pincode);

      if (!result.isServiceable) {
        // Not serviceable - navigate to NotServiceable screen
        navigation.replace('NotServiceable', { pincode });
        return;
      }

      if (!result.success) {
        // Serviceable but error fetching data - show error message
        throw new Error(result.error || 'Could not complete setup. Please try again.');
      }

      // Success - location setup complete, navigate to Main
      console.log('✅ Location setup successful - navigating to Main screen');
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    } catch (error: any) {
      console.error('❌ Error in location setup flow:', error);
      Alert.alert(
        'Error',
        error.message || 'Could not complete setup. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>📍</Text>
          <Text style={styles.title}>Enable Location</Text>
          <Text style={styles.subtitle}>
            Help us find the best kitchens and tiffins near you
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefits}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitEmoji}>🍱</Text>
            <Text style={styles.benefitText}>
              Discover nearby kitchens and fresh meals
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitEmoji}>🚚</Text>
            <Text style={styles.benefitText}>
              Get accurate delivery times and tracking
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitEmoji}>💰</Text>
            <Text style={styles.benefitText}>
              View location-specific offers and deals
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Primary Button */}
          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleUseCurrentLocation}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Use Current Location</Text>
                <Text style={styles.primaryButtonSubtext}>
                  We'll detect your area automatically
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Secondary Button */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleEnterManually}
            disabled={isLoading}
          >
            <Text style={styles.secondaryButtonText}>Enter Pincode Manually</Text>
          </TouchableOpacity>

          {/* Privacy Note */}
          <Text style={styles.privacyNote}>
            🔒 Your location data is secure and never shared with third parties
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  benefits: {
    marginTop: 40,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  benefitEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  actions: {
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  primaryButtonSubtext: {
    fontSize: 13,
    color: '#FFE0D9',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  privacyNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LocationSetupScreen;
