import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Card, Button, Chip, Searchbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import api from '../config/api';

const MyBookingsScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [email, setEmail] = useState('');
  const [searchEmail, setSearchEmail] = useState('');

  const fetchBookings = useCallback(async (emailToSearch) => {
    if (!emailToSearch) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/bookings', {
        params: { email: emailToSearch.toLowerCase() }
      });
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to fetch bookings. Please try again.');
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // You could store the last searched email in AsyncStorage
      // For now, we'll just show the search interface
      setLoading(false);
    }, [])
  );

  const handleSearch = () => {
    if (!searchEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(searchEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setEmail(searchEmail);
    fetchBookings(searchEmail);
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (email) {
      fetchBookings(email);
    } else {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return '#FFA500';
      case 'Confirmed':
        return '#4CAF50';
      case 'Completed':
        return '#2196F3';
      case 'Cancelled':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString, startTime, endTime) => {
    const date = new Date(dateString);
    return `${formatDate(dateString)} at ${startTime} - ${endTime}`;
  };

  const renderBooking = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.expertName}>{item.expertId.name}</Text>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={{ color: 'white', fontSize: 12 }}
          >
            {item.status}
          </Chip>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Category:</Text>
          <Text style={styles.value}>{item.expertId.category}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Date & Time:</Text>
          <Text style={styles.value}>{formatDateTime(item.date, item.startTime, item.endTime)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Booking ID:</Text>
          <Text style={styles.bookingId}>{item.bookingId}</Text>
        </View>

        {item.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.label}>Notes:</Text>
            <Text style={styles.notes}>{item.notes}</Text>
          </View>
        )}

        <View style={styles.contactSection}>
          <Text style={styles.label}>Expert Contact:</Text>
          <Text style={styles.contact}>📧 {item.expertId.email}</Text>
          <Text style={styles.contact}>📱 {item.expertId.phone}</Text>
        </View>

        <View style={styles.buttonRow}>
          {item.status === 'Pending' && (
            <Button
              mode="outlined"
              onPress={() => handleCancelBooking(item._id)}
              style={styles.cancelButton}
              labelStyle={{ color: '#d32f2f' }}
              compact
            >
              Cancel
            </Button>
          )}
          {(item.status === 'Cancelled' || item.status === 'Completed') && (
            <Button
              mode="text"
              onPress={() => handleDeleteBooking(item._id)}
              style={styles.deleteButton}
              labelStyle={{ color: '#757575' }}
              compact
            >
              Remove
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const handleCancelBooking = async (bookingId) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await api.patch(`/bookings/${bookingId}/status`, { status: 'Cancelled' });
              Alert.alert('Success', 'Booking cancelled successfully');
              if (email) {
                fetchBookings(email);
              }
            } catch (error) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const handleDeleteBooking = async (bookingId) => {
    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to remove this booking from your history?')) {
        try {
          await api.delete(`/bookings/${bookingId}`);
          alert('Booking removed successfully');
          if (email) fetchBookings(email);
        } catch (error) {
          console.error('Error deleting booking:', error);
          alert('Failed to delete booking');
        }
      }
    } else {
      Alert.alert(
        'Remove Booking',
        'Are you sure you want to remove this booking from your history?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            onPress: async () => {
              try {
                await api.delete(`/bookings/${bookingId}`);
                if (email) fetchBookings(email);
              } catch (error) {
                console.error('Error deleting booking:', error);
                Alert.alert('Error', 'Failed to delete booking');
              }
            },
          },
        ]
      );
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>Enter your email to view bookings</Text>
    </View>
  );

  const renderNoBookings = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>No bookings found for this email</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Card style={styles.searchCard}>
        <Card.Content>
          <Text style={styles.searchTitle}>Find Your Bookings</Text>
          <View style={styles.searchRow}>
            <Searchbar
              placeholder="Enter your email"
              onChangeText={setSearchEmail}
              value={searchEmail}
              style={styles.searchBar}
              onSubmitEditing={handleSearch}
            />
            <Button
              mode="contained"
              onPress={handleSearch}
              style={styles.searchButton}
              disabled={!searchEmail.trim()}
            >
              Search
            </Button>
          </View>
        </Card.Content>
      </Card>

      {email && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>Bookings for {email}</Text>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" />
              <Text>Loading bookings...</Text>
            </View>
          ) : (
            <FlatList
              data={bookings}
              renderItem={renderBooking}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={renderNoBookings}
            />
          )}
        </View>
      )}

      {!email && !loading && renderEmptyState()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchCard: {
    margin: 16,
    elevation: 2,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
  },
  searchButton: {
    backgroundColor: '#6200ee',
  },
  resultsSection: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expertName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusChip: {
    paddingHorizontal: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  bookingId: {
    fontSize: 12,
    color: '#6200ee',
    fontWeight: 'bold',
    flex: 2,
    textAlign: 'right',
  },
  notesSection: {
    marginVertical: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  notes: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    marginTop: 4,
  },
  contactSection: {
    marginVertical: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  contact: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  cancelButton: {
    borderColor: '#F44336',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default MyBookingsScreen;
