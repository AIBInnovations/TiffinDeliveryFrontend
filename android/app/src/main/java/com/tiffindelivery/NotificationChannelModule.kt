package com.tiffindelivery

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

/**
 * Native module for creating Android notification channels
 * Required for Android 8.0 (API level 26) and above
 */
class NotificationChannelModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "NotificationChannelModule"
    }

    /**
     * Create all notification channels for the app
     * Should be called once when app starts
     */
    @ReactMethod
    fun createNotificationChannels(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                val notificationManager = reactApplicationContext
                    .getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

                // 1. Orders Channel (High Priority)
                // For order status updates, delivery notifications
                val ordersChannel = NotificationChannel(
                    "orders_channel",
                    "Orders",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Order status updates and delivery notifications"
                    enableLights(true)
                    lightColor = android.graphics.Color.parseColor("#F56B4C") // Orange brand color
                    enableVibration(true)
                    vibrationPattern = longArrayOf(0, 300, 200, 300) // Custom vibration pattern
                    setSound(
                        RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                    setShowBadge(true) // Show badge on app icon
                }

                // 2. Subscriptions Channel (High Priority)
                // For subscription updates, voucher notifications, auto-ordering
                val subscriptionsChannel = NotificationChannel(
                    "subscriptions_channel",
                    "Subscriptions",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Subscription and voucher notifications"
                    enableLights(true)
                    lightColor = android.graphics.Color.parseColor("#8B5CF6") // Purple color
                    enableVibration(true)
                    vibrationPattern = longArrayOf(0, 200, 100, 200)
                    setSound(
                        RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                    setShowBadge(true)
                }

                // 3. General Channel (Default Priority)
                // For menu updates, promotional messages, general info
                val generalChannel = NotificationChannel(
                    "general_channel",
                    "General",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "Menu updates and promotional messages"
                    enableLights(true)
                    lightColor = android.graphics.Color.parseColor("#10B981") // Green color
                    enableVibration(false) // No vibration for low priority
                    setSound(
                        RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                    setShowBadge(false) // Don't show badge for general notifications
                }

                // 4. Default Channel (Fallback)
                // For uncategorized notifications
                val defaultChannel = NotificationChannel(
                    "default_channel",
                    "Default",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply {
                    description = "Default notifications"
                    enableLights(true)
                    enableVibration(true)
                    vibrationPattern = longArrayOf(0, 250, 250, 250)
                    setShowBadge(true)
                }

                // Register all channels
                notificationManager.createNotificationChannel(ordersChannel)
                notificationManager.createNotificationChannel(subscriptionsChannel)
                notificationManager.createNotificationChannel(generalChannel)
                notificationManager.createNotificationChannel(defaultChannel)

                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("CHANNEL_ERROR", "Failed to create notification channels: ${e.message}", e)
            }
        } else {
            // Pre-Android O doesn't need channels
            promise.resolve(true)
        }
    }

    /**
     * Delete a notification channel
     * Useful for testing or cleanup
     */
    @ReactMethod
    fun deleteNotificationChannel(channelId: String, promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                val notificationManager = reactApplicationContext
                    .getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

                notificationManager.deleteNotificationChannel(channelId)
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("DELETE_ERROR", "Failed to delete channel: ${e.message}", e)
            }
        } else {
            promise.resolve(true)
        }
    }

    /**
     * Get list of all notification channels
     * Useful for debugging
     */
    @ReactMethod
    fun getNotificationChannels(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                val notificationManager = reactApplicationContext
                    .getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

                val channels = notificationManager.notificationChannels
                val channelList = channels.map { channel ->
                    mapOf(
                        "id" to channel.id,
                        "name" to channel.name.toString(),
                        "importance" to channel.importance
                    )
                }

                promise.resolve(channelList)
            } catch (e: Exception) {
                promise.reject("GET_ERROR", "Failed to get channels: ${e.message}", e)
            }
        } else {
            promise.resolve(emptyList<Map<String, Any>>())
        }
    }
}
