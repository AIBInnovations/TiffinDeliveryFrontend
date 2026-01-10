import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { validatePincode } from '../../services/location.service';
import { fetchMenuForPincode } from '../../services/menuFetch.service';

type NavigationProp = StackNavigationProp<any>;

const PincodeInputScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [pincode, setPincode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePincodeChange = (text: string) => {
    // Only allow digits
    const numericText = text.replace(/[^0-9]/g, '');
    setPincode(numericText);
    setError('');
  };

  const handleSubmit = async () => {
    // Validate pincode
    if (!pincode) {
      setError('Please enter a pincode');
      return;
    }

    if (!validatePincode(pincode)) {
      setError('Please enter a valid 6-digit pincode');
      return;
    }

    setIsLoading(true);

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
        setError(result.error || 'Could not verify pincode. Please try again.');
        return;
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
      console.error('❌ Error in pincode verification:', error);
      setError(error.message || 'Could not verify pincode. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={isLoading}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.emoji}>📮</Text>
          <Text style={styles.title}>Enter Your Pincode</Text>
          <Text style={styles.subtitle}>
            We'll check if we deliver to your area
          </Text>
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="Enter 6-digit pincode"
            placeholderTextColor="#999"
            value={pincode}
            onChangeText={handlePincodeChange}
            keyboardType="numeric"
            maxLength={6}
            autoFocus
            editable={!isLoading}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!pincode || isLoading) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!pincode || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Check Serviceability</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Examples */}
        <View style={styles.examples}>
          <Text style={styles.examplesTitle}>Popular areas we deliver to:</Text>
          <View style={styles.examplesList}>
            <TouchableOpacity
              style={styles.exampleChip}
              onPress={() => handlePincodeChange('560001')}
              disabled={isLoading}
            >
              <Text style={styles.exampleChipText}>560001</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exampleChip}
              onPress={() => handlePincodeChange('560002')}
              disabled={isLoading}
            >
              <Text style={styles.exampleChipText}>560002</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exampleChip}
              onPress={() => handlePincodeChange('560003')}
              disabled={isLoading}
            >
              <Text style={styles.exampleChipText}>560003</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
  emoji: {
    fontSize: 70,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 40,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 18,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 4,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  examples: {
    marginTop: 20,
  },
  examplesTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  examplesList: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  exampleChip: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 4,
  },
  exampleChipText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
});

export default PincodeInputScreen;
