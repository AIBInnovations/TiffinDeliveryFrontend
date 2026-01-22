import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NotificationData } from '../context/NotificationContext';

interface NotificationDetailModalProps {
  visible: boolean;
  notification: NotificationData;
  onClose: () => void;
}

type NavigationProp = NativeStackNavigationProp<any>;

const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  visible,
  notification,
  onClose,
}) => {
  const navigation = useNavigation<NavigationProp>();

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'MENU_UPDATE':
        return { emoji: '👨‍🍳', color: '#3B82F6' };
      case 'ORDER_STATUS_CHANGE':
        return { emoji: '📦', color: '#10B981' };
      case 'VOUCHER_EXPIRY_REMINDER':
        return { emoji: '🎟️', color: '#F59E0B' };
      case 'ADMIN_PUSH':
        return { emoji: '🔔', color: '#8B5CF6' };
      default:
        return { emoji: '📬', color: '#6B7280' };
    }
  };

  // Get action button config based on notification type
  const getActionButton = () => {
    switch (notification.type) {
      case 'ORDER_STATUS_CHANGE':
        return {
          label: 'View Order',
          action: () => {
            onClose();
            if (notification.entityId) {
              navigation.navigate('OrderDetail', { orderId: notification.entityId });
            }
          },
        };

      case 'MENU_UPDATE':
        return {
          label: 'Check Menu',
          action: () => {
            onClose();
            // Navigate to kitchen menu if kitchenId is available
            if (notification.data?.kitchenId) {
              navigation.navigate('Home');
            } else {
              navigation.navigate('Home');
            }
          },
        };

      case 'VOUCHER_EXPIRY_REMINDER':
        return {
          label: 'Use Vouchers',
          action: () => {
            onClose();
            navigation.navigate('Vouchers');
          },
        };

      case 'ADMIN_PUSH':
        // Handle custom screen navigation from data.screen
        if (notification.data?.screen) {
          const screenMap: Record<string, string> = {
            SUBSCRIPTIONS: 'MealPlans',
            ORDERS: 'YourOrders',
            VOUCHERS: 'Vouchers',
            HOME: 'Home',
          };

          const targetScreen = screenMap[notification.data.screen] || 'Home';
          return {
            label: 'View Details',
            action: () => {
              onClose();
              navigation.navigate(targetScreen);
            },
          };
        }
        return null;

      default:
        return null;
    }
  };

  const { emoji, color } = getNotificationIcon(notification.type);
  const actionButton = getActionButton();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.container}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.content}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Icon */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${color}20` },
                ]}
              >
                <Text style={styles.icon}>{emoji}</Text>
              </View>

              {/* Title */}
              <Text style={styles.title}>{notification.title}</Text>

              {/* Body */}
              <Text style={styles.body}>{notification.body}</Text>

              {/* Timestamp */}
              <Text style={styles.timestamp}>
                {formatTime(notification.createdAt)}
              </Text>

              {/* Additional Data (if any) */}
              {notification.type === 'ORDER_STATUS_CHANGE' &&
                notification.data?.orderNumber && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Order Number:</Text>
                    <Text style={styles.infoValue}>
                      {notification.data.orderNumber}
                    </Text>
                  </View>
                )}

              {notification.type === 'VOUCHER_EXPIRY_REMINDER' &&
                notification.data?.voucherCount && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoLabel}>Expiring Vouchers:</Text>
                    <Text style={styles.infoValue}>
                      {notification.data.voucherCount} voucher(s)
                    </Text>
                  </View>
                )}

              {notification.type === 'ADMIN_PUSH' &&
                notification.data?.promoCode && (
                  <View style={styles.promoBox}>
                    <Text style={styles.promoLabel}>Promo Code:</Text>
                    <Text style={styles.promoCode}>
                      {notification.data.promoCode}
                    </Text>
                  </View>
                )}

              {/* Action Button */}
              {actionButton && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={actionButton.action}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionButtonText}>
                    {actionButton.label}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 450,
    maxHeight: '80%',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  closeIcon: {
    fontSize: 24,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  scrollContent: {
    paddingTop: 16,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 12,
    textAlign: 'center',
  },
  timestamp: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  promoBox: {
    backgroundColor: '#FEF2F0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  promoLabel: {
    fontSize: 13,
    color: '#F56B4C',
    marginBottom: 6,
    fontWeight: '600',
  },
  promoCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F56B4C',
    letterSpacing: 1,
  },
  actionButton: {
    backgroundColor: '#F56B4C',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default NotificationDetailModal;
