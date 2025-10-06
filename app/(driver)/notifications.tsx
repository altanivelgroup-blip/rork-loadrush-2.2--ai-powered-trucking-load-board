import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Bell, Mail, MessageSquare } from 'lucide-react-native';

type NotificationChannel = {
  id: string;
  title: string;
  description: string;
  icon: 'bell' | 'mail' | 'message';
  enabled: boolean;
};

type NotificationCategory = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
};

function NotificationsScreenInner() {
  const router = useRouter();

  const [channels, setChannels] = useState<NotificationChannel[]>([
    {
      id: 'push',
      title: 'Push Notifications',
      description: 'Receive alerts on your device',
      icon: 'bell',
      enabled: true,
    },
    {
      id: 'email',
      title: 'Email',
      description: 'Get emails about important updates',
      icon: 'mail',
      enabled: true,
    },
    {
      id: 'sms',
      title: 'SMS',
      description: 'Texts for critical events',
      icon: 'message',
      enabled: false,
    },
  ]);

  const [categories, setCategories] = useState<NotificationCategory[]>([
    {
      id: 'load-updates',
      title: 'Load Updates',
      description: 'Notifications about load status changes',
      enabled: true,
    },
    {
      id: 'payments',
      title: 'Payments',
      description: 'Payment confirmations and updates',
      enabled: true,
    },
    {
      id: 'system',
      title: 'System',
      description: 'App updates and maintenance notices',
      enabled: true,
    },
  ]);

  const toggleChannel = useCallback((id: string) => {
    setChannels((prev) =>
      prev.map((channel) =>
        channel.id === id ? { ...channel, enabled: !channel.enabled } : channel
      )
    );
    console.log(`[Notifications] Toggled channel: ${id}`);
  }, []);

  const toggleCategory = useCallback((id: string) => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === id ? { ...category, enabled: !category.enabled } : category
      )
    );
    console.log(`[Notifications] Toggled category: ${id}`);
  }, []);

  const renderChannelIcon = (iconType: 'bell' | 'mail' | 'message') => {
    const iconProps = { size: 20, color: '#1F2937' };
    switch (iconType) {
      case 'bell':
        return <Bell {...iconProps} />;
      case 'mail':
        return <Mail {...iconProps} />;
      case 'message':
        return <MessageSquare {...iconProps} />;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notifications',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
              testID="back-button"
            >
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerShadowVisible: false,
        }}
      />
      <View style={styles.container} testID="notifications-container">
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Channels</Text>

            <View style={styles.card}>
              {channels.map((channel, index) => (
                <View
                  key={channel.id}
                  style={[
                    styles.channelItem,
                    index < channels.length - 1 && styles.itemBorder,
                  ]}
                  testID={`channel-${channel.id}`}
                >
                  <View style={styles.channelIconContainer}>
                    {renderChannelIcon(channel.icon)}
                  </View>
                  <View style={styles.channelContent}>
                    <Text style={styles.channelTitle}>{channel.title}</Text>
                    <Text style={styles.channelDescription}>
                      {channel.description}
                    </Text>
                  </View>
                  <Switch
                    value={channel.enabled}
                    onValueChange={() => toggleChannel(channel.id)}
                    trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                    thumbColor="#fff"
                    testID={`channel-switch-${channel.id}`}
                  />
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>

            <View style={styles.card}>
              {categories.map((category, index) => (
                <View
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    index < categories.length - 1 && styles.itemBorder,
                  ]}
                  testID={`category-${category.id}`}
                >
                  <View style={styles.categoryContent}>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    <Text style={styles.categoryDescription}>
                      {category.description}
                    </Text>
                  </View>
                  <Switch
                    value={category.enabled}
                    onValueChange={() => toggleCategory(category.id)}
                    trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                    thumbColor="#fff"
                    testID={`category-switch-${category.id}`}
                  />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const NotificationsScreen = React.memo(NotificationsScreenInner);
export default NotificationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  channelIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  channelContent: {
    flex: 1,
  },
  channelTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 2,
  },
  channelDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
});
