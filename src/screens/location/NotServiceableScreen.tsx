import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RouteParams = {
  NotServiceable: {
    pincode: string;
  };
};

type NavigationProp = StackNavigationProp<any>;

const NotServiceableScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'NotServiceable'>>();
  const pincode = route.params?.pincode || '';

  const handleTryDifferentLocation = () => {
    navigation.navigate('PincodeInput');
  };

  const handleNotifyMe = () => {
    // TODO: Implement notify me functionality
    // Could open email or WhatsApp
    const whatsappUrl = `whatsapp://send?phone=919876543210&text=Hi, I'd like to be notified when Tiffsy starts delivering to pincode ${pincode}`;
    Linking.openURL(whatsappUrl).catch(() => {
      // Fallback to email
      const emailUrl = `mailto:support@tiffsy.com?subject=Notify me - Pincode ${pincode}&body=Please notify me when you start delivering to pincode ${pincode}`;
      Linking.openURL(emailUrl);
    });
  };


  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Illustration */}
        <View style={styles.illustration}>
          <Text style={styles.emoji}>😔</Text>
        </View>

        {/* Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>We're Not Here Yet!</Text>
          <Text style={styles.message}>
            Unfortunately, we don't deliver to{' '}
            <Text style={styles.pincode}>{pincode}</Text> yet.
          </Text>
          <Text style={styles.submessage}>
            But don't worry! We're expanding rapidly and will be in your area soon.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>50+</Text>
            <Text style={styles.statLabel}>Cities</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>500+</Text>
            <Text style={styles.statLabel}>Pincodes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>1000+</Text>
            <Text style={styles.statLabel}>Kitchens</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNotifyMe}
          >
            <Text style={styles.primaryButtonText}>Notify Me When Available</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleTryDifferentLocation}
          >
            <Text style={styles.secondaryButtonText}>Try Different Pincode</Text>
          </TouchableOpacity>
        </View>

        {/* Contact */}
        <View style={styles.contact}>
          <Text style={styles.contactText}>
            Have questions? Contact us at{' '}
            <Text
              style={styles.contactLink}
              onPress={() => Linking.openURL('mailto:support@tiffsy.com')}
            >
              support@tiffsy.com
            </Text>
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
  illustration: {
    alignItems: 'center',
    marginTop: 60,
  },
  emoji: {
    fontSize: 100,
  },
  messageContainer: {
    alignItems: 'center',
    marginTop: -20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  pincode: {
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  submessage: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFF5F2',
    borderRadius: 16,
    padding: 24,
    marginVertical: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#FFD4C4',
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
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  contact: {
    paddingVertical: 12,
  },
  contactText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  contactLink: {
    color: '#FF6B35',
    fontWeight: '600',
  },
});

export default NotServiceableScreen;
