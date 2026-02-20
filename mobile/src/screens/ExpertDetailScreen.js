import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Card, Button, Chip, Divider } from 'react-native-paper';
import api from '../config/api';
import socketService from '../services/socketService';

const ExpertDetailScreen = ({ route, navigation }) => {
  const { expertId } = route.params;
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookedSlots, setBookedSlots] = useState(new Set());

  const fetchExpert = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/experts/${expertId}`);
      setExpert(response.data);
      
      // Set first available date as default
      const dates = Object.keys(response.data.groupedTimeSlots || {});
      if (dates.length > 0 && !selectedDate) {
        setSelectedDate(dates[0]);
      }
    } catch (error) {
      console.error('Error fetching expert:', error);
      Alert.alert('Error', 'Failed to load expert details');
    } finally {
      setLoading(false);
    }
  }, [expertId, selectedDate]);

  useEffect(() => {
    fetchExpert();
  }, [fetchExpert]);

  useEffect(() => {
    // Connect to socket and join expert room
    socketService.connect();
    socketService.joinExpertRoom(expertId);

    // Listen for slot-booked events
    const handleSlotBooked = (data) => {
      if (data.expertId === expertId) {
        setBookedSlots(prev => new Set([...prev, `${data.date}-${data.startTime}`]));
      }
    };

    socketService.on('slot-booked', handleSlotBooked);

    return () => {
      socketService.off('slot-booked', handleSlotBooked);
      socketService.disconnect();
    };
  }, [expertId]);

  const handleSlotSelect = (slot) => {
    if (slot.isBooked || bookedSlots.has(`${selectedDate}-${slot.startTime}`)) {
      Alert.alert('Slot Unavailable', 'This time slot has already been booked.');
      return;
    }
    setSelectedSlot(slot);
  };

  const handleBooking = () => {
    if (!selectedSlot || !selectedDate) {
      Alert.alert('Select a Time Slot', 'Please select a date and time slot to continue.');
      return;
    }

    navigation.navigate('Booking', {
      expertId,
      expertName: expert.name,
      date: selectedDate,
      timeSlot: selectedSlot,
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === tomorrow.toISOString().split('T')[0]) {
      return 'Tomorrow';
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
        <Text>Loading expert details...</Text>
      </View>
    );
  }

  if (!expert) {
    return (
      <View style={styles.loading}>
        <Text>Expert not found</Text>
        <Button onPress={() => navigation.goBack()} style={styles.backButton}>
          Go Back
        </Button>
      </View>
    );
  }

  const availableDates = Object.keys(expert.groupedTimeSlots || {});
  const availableSlots = selectedDate ? expert.groupedTimeSlots[selectedDate] || [] : [];

  return (
    <ScrollView style={styles.container}>
      {/* Expert Info Card */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <View style={styles.header}>
            <Text style={styles.name}>{expert.name}</Text>
            <View style={styles.rating}>
              <Text style={styles.ratingText}>⭐ {expert.rating.toFixed(1)}</Text>
            </View>
          </View>
          
          <Chip style={styles.category}>{expert.category}</Chip>
          
          <Text style={styles.experience}>{expert.experience} years experience</Text>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.bio}>{expert.bio}</Text>
          
          <View style={styles.contactInfo}>
            <Text style={styles.contactText}>📧 {expert.email}</Text>
            <Text style={styles.contactText}>📞 {expert.phone}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Date Selection */}
      <Card style={styles.slotsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.dateContainer}>
              {availableDates.map((date) => (
                <TouchableOpacity
                  key={date}
                  style={[
                    styles.dateButton,
                    selectedDate === date && styles.selectedDate,
                  ]}
                  onPress={() => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                  }}
                >
                  <Text
                    style={[
                      styles.dateText,
                      selectedDate === date && styles.selectedDateText,
                    ]}
                  >
                    {formatDate(date)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Time Slots */}
          {selectedDate && (
            <>
              <Divider style={styles.divider} />
              <Text style={styles.sectionTitle}>Available Time Slots</Text>
              
              {availableSlots.length === 0 ? (
                <Text style={styles.noSlots}>No available slots for this date</Text>
              ) : (
                <View style={styles.slotsGrid}>
                  {availableSlots.map((slot) => {
                    const isBooked = slot.isBooked || bookedSlots.has(`${selectedDate}-${slot.startTime}`);
                    const isSelected = selectedSlot?._id === slot._id;
                    
                    return (
                      <TouchableOpacity
                        key={slot._id}
                        style={[
                          styles.slotButton,
                          isBooked && styles.bookedSlot,
                          isSelected && styles.selectedSlot,
                        ]}
                        onPress={() => handleSlotSelect(slot)}
                        disabled={isBooked}
                      >
                        <Text
                          style={[
                            styles.slotText,
                            isBooked && styles.bookedSlotText,
                            isSelected && styles.selectedSlotText,
                          ]}
                        >
                          {slot.startTime} - {slot.endTime}
                        </Text>
                        {isBooked && <Text style={styles.bookedLabel}>Booked</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </Card.Content>
      </Card>

      {/* Book Button */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleBooking}
          disabled={!selectedSlot}
          style={styles.bookButton}
          contentStyle={styles.buttonContent}
        >
          {selectedSlot ? 'Proceed to Booking' : 'Select a Time Slot'}
        </Button>
        
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Back to Experts
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    margin: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  rating: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  category: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  experience: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 12,
  },
  bio: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  contactInfo: {
    marginTop: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  slotsCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedDate: {
    backgroundColor: '#6200ee',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedDateText: {
    color: 'white',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#90caf9',
    minWidth: 100,
    alignItems: 'center',
  },
  bookedSlot: {
    backgroundColor: '#ffebee',
    borderColor: '#ef9a9a',
  },
  selectedSlot: {
    backgroundColor: '#6200ee',
    borderColor: '#6200ee',
  },
  slotText: {
    fontSize: 13,
    color: '#1565c0',
    fontWeight: '500',
  },
  bookedSlotText: {
    color: '#c62828',
    textDecorationLine: 'line-through',
  },
  selectedSlotText: {
    color: 'white',
  },
  bookedLabel: {
    fontSize: 10,
    color: '#c62828',
    marginTop: 2,
  },
  noSlots: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  bookButton: {
    backgroundColor: '#6200ee',
  },
  backButton: {
    borderColor: '#6200ee',
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default ExpertDetailScreen;
