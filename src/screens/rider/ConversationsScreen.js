// src/screens/rider/ConversationsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../../styles/colors';
import api from '../../services/api';

const ConversationsScreen = ({ navigation }) => {
  const { user } = useSelector(state => state.auth);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching conversations for rider...');
      const response = await api.get('/chat/conversations');
      console.log('📨 Conversations response:', response.data);
      setConversations(response.data.data?.conversations || []);
    } catch (error) {
      console.error('❌ Failed to fetch conversations:', error);
      console.error('❌ Error details:', error.response?.data);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  const renderConversationItem = ({ item }) => {
    const otherParticipant = item.participants?.find(p => p._id !== user._id);
    const hasUnreadMessages = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={[
          styles.conversationCard,
          hasUnreadMessages && styles.conversationCardUnread,
        ]}
        onPress={() =>
          navigation.navigate('ChatScreen', {
            orderId: item.orderId,
            receiverName: otherParticipant?.name || 'Customer',
          })
        }
      >
        <View style={styles.conversationLeft}>
          <View style={styles.avatarContainer}>
            <Icon name="person" size={24} color={colors.white} />
            {hasUnreadMessages && <View style={styles.unreadIndicator} />}
          </View>
          <View style={styles.conversationInfo}>
            <Text style={[
              styles.participantName,
              hasUnreadMessages && styles.participantNameUnread,
            ]}>
              {otherParticipant?.name || 'Customer'}
            </Text>
            <Text style={styles.orderId}>
              Order #{item.orderId?.slice(-6) || 'Unknown'}
            </Text>
            <Text style={[
              styles.lastMessage,
              hasUnreadMessages && styles.lastMessageUnread,
            ]} numberOfLines={1}>
              {item.lastMessage?.message || 'No messages yet'}
            </Text>
          </View>
        </View>
        <View style={styles.conversationRight}>
          <Text style={styles.timeText}>
            {item.lastMessage?.createdAt ? formatTime(item.lastMessage.createdAt) : ''}
          </Text>
          {hasUnreadMessages && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
          <Icon name="chevron-forward" size={16} color={colors.text.secondary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Icon name="refresh" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item._id || item.orderId}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="chatbubbles" size={64} color={colors.lightGray} />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>
              Your messages with customers will appear here
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conversationCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  conversationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.white,
  },
  conversationInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  participantNameUnread: {
    fontWeight: 'bold',
  },
  orderId: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  lastMessageUnread: {
    color: colors.text.primary,
    fontWeight: '500',
  },
  conversationRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 50,
  },
  timeText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default ConversationsScreen;
