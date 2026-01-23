import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { NotificationData } from '../context/NotificationContext';
import { NotificationType } from '../constants/notificationTypes';

interface NotificationPopupProps {
  visible: boolean;
  notification: NotificationData | null;
  onDismiss: () => void;
  onView: () => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({
  visible,
  notification,
  onDismiss,
  onView,
}) => {
  // Auto-dismiss after 10 seconds (increased from 5s for better UX)
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!notification) return null;

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      // Order notifications
      case NotificationType.ORDER_ACCEPTED:
        return '✅';
      case NotificationType.ORDER_PREPARING:
        return '👨‍🍳';
      case NotificationType.ORDER_READY:
        return '🍱';
      case NotificationType.ORDER_PICKED_UP:
      case NotificationType.ORDER_OUT_FOR_DELIVERY:
        return '🚗';
      case NotificationType.ORDER_DELIVERED:
        return '✅';
      case NotificationType.ORDER_CANCELLED:
      case NotificationType.ORDER_REJECTED:
        return '❌';
      case NotificationType.AUTO_ORDER_SUCCESS:
        return '✅';
      case NotificationType.AUTO_ORDER_FAILED:
        return '⚠️';
      case NotificationType.ORDER_STATUS_CHANGE:
        return '📦';

      // Subscription notifications
      case NotificationType.VOUCHER_EXPIRY_REMINDER:
        return '🎟️';
      case NotificationType.SUBSCRIPTION_CREATED:
        return '🎉';

      // General notifications
      case NotificationType.MENU_UPDATE:
        return '👨‍🍳';
      case NotificationType.PROMOTIONAL:
        return '🎁';
      case NotificationType.ADMIN_PUSH:
        return '🔔';

      default:
        return '📬';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable
          style={styles.container}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.content}>
            {/* Icon and Close Button */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{getNotificationIcon(notification.type)}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onDismiss}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Title */}
            <Text style={styles.title} numberOfLines={2}>
              {notification.title}
            </Text>

            {/* Body */}
            <Text style={styles.body} numberOfLines={3}>
              {notification.body}
            </Text>

            {/* Timestamp */}
            <Text style={styles.timestamp}>
              {formatTime(notification.createdAt)}
            </Text>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.dismissButton]}
                onPress={onDismiss}
                activeOpacity={0.7}
              >
                <Text style={styles.dismissButtonText}>Dismiss</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.viewButton]}
                onPress={onView}
                activeOpacity={0.7}
              >
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
            </View>
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
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  container: {
    width: '100%',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF2F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 24,
  },
  body: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  dismissButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  viewButton: {
    backgroundColor: '#F56B4C',
  },
  viewButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default NotificationPopup;
