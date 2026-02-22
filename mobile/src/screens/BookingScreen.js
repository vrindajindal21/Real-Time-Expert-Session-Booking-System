import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Card, TextInput, Button, HelperText } from 'react-native-paper';
import api from '../config/api';

const BookingScreen = ({ route, navigation }) => {
  const { expertId, expertName, date, timeSlot } = route.params;

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Name is required';
    } else if (formData.customerName.trim().length < 2) {
      newErrors.customerName = 'Name must be at least 2 characters';
    }

    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Please enter a valid email';
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Phone number is required';
    } else if (!/^\d{10,15}$/.test(formData.customerPhone.replace(/\D/g, ''))) {
      newErrors.customerPhone = 'Please enter a valid phone number (10-15 digits)';
    }

    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Notes must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    console.log('Submit button clicked');
    if (!validateForm()) {
      console.log('Validation failed', errors);
      if (Platform.OS === 'web') alert('Please fix the errors in the form.');
      return;
    }

    setLoading(true);
    console.log('Sending booking data...', formData);

    try {
      const bookingData = {
        expertId,
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim().toLowerCase(),
        customerPhone: formData.customerPhone.trim(),
        date,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        notes: formData.notes.trim(),
      };

      const response = await api.post('/bookings', bookingData);
      console.log('Booking response:', response.data);

      if (Platform.OS === 'web') {
        alert(
          `Booking Confirmed!\n\nYour session with ${expertName} has been booked successfully.\nBooking ID: ${response.data.booking.bookingId}`
        );
        navigation.navigate('ExpertList');
      } else {
        Alert.alert(
          'Booking Confirmed!',
          `Your session with ${expertName} has been booked successfully.\n\nBooking ID: ${response.data.booking.bookingId}\nDate: ${new Date(date).toLocaleDateString()}\nTime: ${timeSlot.startTime} - ${timeSlot.endTime}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('ExpertList'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error creating booking:', error);

      let errorMessage = 'Failed to create booking. Please try again.';

      if (error.response) {
        if (error.response.status === 409) {
          errorMessage = 'This time slot is no longer available. Please select another slot.';
        } else if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }

      if (Platform.OS === 'web') {
        alert('Booking Failed: ' + errorMessage);
      } else {
        Alert.alert('Booking Failed', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.title}>Booking Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.label}>Expert:</Text>
              <Text style={styles.value}>{expertName}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.label}>Date:</Text>
              <Text style={styles.value}>{formatDate(date)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.label}>Time:</Text>
              <Text style={styles.value}>{timeSlot.startTime} - {timeSlot.endTime}</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.formCard}>
          <Card.Content>
            <Text style={styles.title}>Your Information</Text>

            <TextInput
              label="Full Name *"
              value={formData.customerName}
              onChangeText={(value) => handleInputChange('customerName', value)}
              error={!!errors.customerName}
              style={styles.input}
              mode="outlined"
            />
            <HelperText type="error" visible={!!errors.customerName}>
              {errors.customerName}
            </HelperText>

            <TextInput
              label="Email Address *"
              value={formData.customerEmail}
              onChangeText={(value) => handleInputChange('customerEmail', value)}
              error={!!errors.customerEmail}
              style={styles.input}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <HelperText type="error" visible={!!errors.customerEmail}>
              {errors.customerEmail}
            </HelperText>

            <TextInput
              label="Phone Number *"
              value={formData.customerPhone}
              onChangeText={(value) => handleInputChange('customerPhone', value)}
              error={!!errors.customerPhone}
              style={styles.input}
              mode="outlined"
              keyboardType="phone-pad"
            />
            <HelperText type="error" visible={!!errors.customerPhone}>
              {errors.customerPhone}
            </HelperText>

            <TextInput
              label="Additional Notes (Optional)"
              value={formData.notes}
              onChangeText={(value) => handleInputChange('notes', value)}
              error={!!errors.notes}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
              maxLength={500}
            />
            <HelperText type="error" visible={!!errors.notes}>
              {errors.notes}
            </HelperText>

            <Text style={styles.characterCount}>
              {formData.notes.length}/500 characters
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.bookButton}
            contentStyle={styles.buttonContent}
          >
            {loading ? 'Booking...' : 'Confirm Booking'}
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            contentStyle={styles.buttonContent}
          >
            Cancel
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    ...(Platform.OS === 'web' ? { overflowY: 'auto' } : {}),
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 120,
    flexGrow: 1,
  },
  summaryCard: {
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    elevation: 2,
    borderRadius: 8,
  },
  formCard: {
    marginHorizontal: 12,
    marginBottom: 16,
    elevation: 2,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  input: {
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: -8,
    marginBottom: 16,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  bookButton: {
    backgroundColor: '#6200ee',
  },
  cancelButton: {
    borderColor: '#6200ee',
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default BookingScreen;
