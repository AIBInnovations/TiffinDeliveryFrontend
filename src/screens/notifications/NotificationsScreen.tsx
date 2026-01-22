import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationData } from '../../context/NotificationContext';
import NotificationDetailModal from '../../components/NotificationDetailModal';

type Props = StackScreenProps<any, 'Notifications'>;

const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const {
    notifications,
    isLoading,
    isRefreshing,
    hasMore,
    fetchNotifications,
    refreshNotifications,
    loadMoreNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [selectedNotification, setSelectedNotification] = useState<NotificationData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch notifications on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchNotifications(1);
    }, [fetchNotifications])
  );

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    await refreshNotifications();
  }, [refreshNotifications]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadMoreNotifications();
    }
  }, [isLoading, hasMore, loadMoreNotifications]);

  // Handle notification tap
  const handleNotificationPress = useCallback(
    async (notification: NotificationData) => {
      setSelectedNotification(notification);
      setShowDetailModal(true);

      // Mark as read if unread
      if (!notification.isRead) {
        await markAsRead(notification._id);
      }
    },
    [markAsRead]
  );

  // Handle delete
  const handleDelete = useCallback(
    async (notificationId: string) => {
      Alert.alert(
        'Delete Notification',
        'Are you sure you want to delete this notification?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await deleteNotification(notificationId);
            },
          },
        ]
      );
    },
    [deleteNotification]
  );

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

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
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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

  // Render swipeable delete action
  const renderRightActions = (notificationId: string) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDelete(notificationId)}
        activeOpacity={0.7}
      >
        <Text style={styles.deleteActionText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  // Render notification item
  const renderNotificationItem = ({ item }: { item: NotificationData }) => {
    const { emoji, color } = getNotificationIcon(item.type);

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item._id)}
        overshootRight={false}
      >
        <TouchableOpacity
          style={[
            styles.notificationItem,
            !item.isRead && styles.unreadNotification,
          ]}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.7}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
            <Text style={styles.iconEmoji}>{emoji}</Text>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {/* Title and Timestamp */}
            <View style={styles.headerRow}>
              <Text
                style={[
                  styles.title,
                  !item.isRead && styles.unreadTitle,
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>

            {/* Body */}
            <Text style={styles.body} numberOfLines={2}>
              {item.body}
            </Text>

            {/* Timestamp */}
            <Text style={styles.timestamp}>{formatTime(item.createdAt)}</Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔔</Text>
        <Text style={styles.emptyTitle}>No notifications yet</Text>
        <Text style={styles.emptyMessage}>
          We'll notify you when there's something new!
        </Text>
      </View>
    );
  };

  // Render footer loading indicator
  const renderFooter = () => {
    if (!hasMore || isLoading) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#F56B4C" />
      </View>
    );
  };

  const hasUnreadNotifications = notifications.some((n) => !n.isRead);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        {hasUnreadNotifications && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}

        {!hasUnreadNotifications && <View style={styles.placeholder} />}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderNotificationItem}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#F56B4C']}
            tintColor="#F56B4C"
          />
        }
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyList : styles.list
        }
      />

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <NotificationDetailModal
          visible={showDetailModal}
          notification={selectedNotification}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedNotification(null);
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#1F2937',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  markAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F56B4C',
  },
  placeholder: {
    width: 80,
  },
  list: {
    paddingVertical: 8,
  },
  emptyList: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
  },
  unreadNotification: {
    backgroundColor: 'white',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 24,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  body: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 4,
    marginRight: 12,
    borderRadius: 12,
  },
  deleteActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export default NotificationsScreen;
