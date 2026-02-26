import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    FlatList,
    ActivityIndicator
} from 'react-native';
import { Button, Card, Divider, Chip, Title, Paragraph } from 'react-native-paper';
import api from '../config/api';

const ManageResourceScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [resourceType, setResourceType] = useState('Person');
    const [companyName, setCompanyName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [bio, setBio] = useState('');
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        setLoading(true);
        try {
            const response = await api.get('/experts');
            setResources(response.data.experts);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!name || !category || !email || !phone || !bio) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            // Mock some slots for the new resource so it's bookable
            const dates = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(d.getDate() + i);
                d.setHours(0, 0, 0, 0);
                dates.push(d);
            }
            const timeSlots = dates.flatMap(date => [
                { date, startTime: '09:00', endTime: '10:00', isBooked: false },
                { date, startTime: '11:00', endTime: '12:00', isBooked: false },
                { date, startTime: '14:00', endTime: '15:00', isBooked: false }
            ]);

            const payload = {
                name,
                category,
                resourceType,
                companyName: companyName || 'Independent',
                phone,
                email,
                bio,
                timeSlots
            };

            await api.post('/experts', payload);
            Alert.alert('Success', 'Listing added successfully!');

            // Clear form
            setName('');
            setCategory('');
            setPhone('');
            setEmail('');
            setBio('');
            setCompanyName('');

            fetchResources();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to add listing');
        } finally {
            setSubmitting(false);
        }
    };

    const deleteResource = async (id) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to remove this listing?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/experts/${id}`);
                            fetchResources();
                        } catch (err) {
                            Alert.alert('Error', 'Delete failed');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Title style={styles.title}>Add New Service/Resource</Title>
                <Card style={styles.formCard}>
                    <Card.Content>
                        <TextInput
                            style={styles.input}
                            placeholder="Name (e.g. Dr. House, Central Library)"
                            value={name}
                            onChangeText={setName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Category (e.g. Doctor, Library, Movie)"
                            value={category}
                            onChangeText={setCategory}
                        />

                        <Text style={styles.label}>Resource Type:</Text>
                        <View style={styles.chipGroup}>
                            {['Person', 'Place', 'Item', 'Service'].map((type) => (
                                <Chip
                                    key={type}
                                    selected={resourceType === type}
                                    onPress={() => setResourceType(type)}
                                    style={styles.chip}
                                >
                                    {type}
                                </Chip>
                            ))}
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Company/Owner Name"
                            value={companyName}
                            onChangeText={setCompanyName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number"
                            value={phone}
                            keyboardType="phone-pad"
                            onChangeText={setPhone}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Email Address"
                            value={email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            onChangeText={setEmail}
                        />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Description / Bio"
                            value={bio}
                            multiline
                            numberOfLines={3}
                            onChangeText={setBio}
                        />

                        <Button
                            mode="contained"
                            onPress={handleSubmit}
                            loading={submitting}
                            style={styles.button}
                        >
                            Add Listing
                        </Button>
                    </Card.Content>
                </Card>

                <Divider style={styles.divider} />
                <Title style={styles.title}>Current Listings</Title>

                {loading ? (
                    <ActivityIndicator size="small" color="#6200ee" />
                ) : (
                    resources.map(item => (
                        <Card key={item._id} style={styles.itemCard}>
                            <Card.Content>
                                <View style={styles.itemHeader}>
                                    <View>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemSub}>{item.category} • {item.companyName}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => deleteResource(item._id)}>
                                        <Text style={styles.deleteText}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </Card.Content>
                        </Card>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scroll: {
        padding: 16,
    },
    title: {
        fontSize: 20,
        marginBottom: 16,
        color: '#333',
    },
    formCard: {
        marginBottom: 20,
        elevation: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        backgroundColor: 'white',
    },
    label: {
        marginBottom: 8,
        fontWeight: 'bold',
        color: '#666',
    },
    chipGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    chip: {
        marginRight: 8,
        marginBottom: 8,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    button: {
        marginTop: 8,
        backgroundColor: '#6200ee',
    },
    divider: {
        marginVertical: 24,
    },
    itemCard: {
        marginBottom: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    itemSub: {
        fontSize: 12,
        color: '#666',
    },
    deleteText: {
        color: '#d32f2f',
        fontWeight: 'bold',
    }
});

export default ManageResourceScreen;
