import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { Surface, Title, Paragraph, Card, Divider, Button, Avatar } from 'react-native-paper';
import api from '../config/api';

const { width } = Dimensions.get('window');

const CompanyDashboardScreen = ({ navigation, route }) => {
    const { companyId } = route.params || { companyId: 'city_hospital' };
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ revenue: 1250, bookings: 24, experts: 5 });
    const [recentBookings, setRecentBookings] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // In a real SaaS, these would be filtered by companyId
            // For this demo, we use mock stats and real experts
            const response = await api.get('/experts');
            setStats({
                revenue: response.data.experts.length * 150, // Mock calculation
                bookings: 12,
                experts: response.data.experts.length
            });
            // Mock recent bookings
            setRecentBookings([
                { id: '1', customer: 'Alice Wong', service: 'Healthcare', time: '10:00 AM', price: 150 },
                { id: '2', customer: 'Bob Smith', service: 'Technology', time: '11:00 AM', price: 200 },
                { id: '3', customer: 'Charlie Day', service: 'Consulting', time: '02:00 PM', price: 100 },
            ]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#6200ee" />
                <Text style={styles.loadingText}>Initializing Command Center...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <Title style={styles.welcomeText}>Command Center</Title>
                    <Paragraph style={styles.companyText}>Operating as: {companyId}</Paragraph>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <Surface style={styles.statCard}>
                        <Text style={styles.statIcon}>💰</Text>
                        <Text style={styles.statValue}>${stats.revenue}</Text>
                        <Text style={styles.statLabel}>Revenue</Text>
                    </Surface>
                    <Surface style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
                        <Text style={styles.statIcon}>📅</Text>
                        <Text style={styles.statValue}>{stats.bookings}</Text>
                        <Text style={styles.statLabel}>Bookings</Text>
                    </Surface>
                    <Surface style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
                        <Text style={styles.statIcon}>👥</Text>
                        <Text style={styles.statValue}>{stats.experts}</Text>
                        <Text style={styles.statLabel}>Team</Text>
                    </Surface>
                </View>

                {/* Quick Actions */}
                <Title style={styles.sectionTitle}>Quick Management</Title>
                <View style={styles.actionGrid}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('ManageResource')}
                    >
                        <Surface style={styles.actionSurface}>
                            <Text style={styles.statIcon}>➕</Text>
                            <Text style={styles.actionLabel}>Add Expert</Text>
                        </Surface>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Surface style={styles.actionSurface}>
                            <Text style={styles.statIcon}>📊</Text>
                            <Text style={styles.actionLabel}>Reports</Text>
                        </Surface>
                    </TouchableOpacity>
                </View>

                {/* Recent Activity */}
                <View style={styles.recentSection}>
                    <View style={styles.sectionHeader}>
                        <Title style={styles.sectionTitle}>Recent Sessions</Title>
                        <TouchableOpacity>
                            <Text style={styles.viewAll}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    {recentBookings.map(booking => (
                        <Card key={booking.id} style={styles.bookingCard}>
                            <Card.Content style={styles.bookingContent}>
                                <Avatar.Text size={40} label={booking.customer[0]} style={styles.avatar} />
                                <View style={styles.bookingInfo}>
                                    <Text style={styles.customerName}>{booking.customer}</Text>
                                    <Text style={styles.serviceText}>{booking.service} • {booking.time}</Text>
                                </View>
                                <Text style={styles.priceText}>+${booking.price}</Text>
                            </Card.Content>
                        </Card>
                    ))}
                </View>
            </ScrollView>

            <Button
                mode="text"
                onPress={() => navigation.replace('UserSelection')}
                style={styles.logoutButton}
            >
                Switch Profile / Logout
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fb',
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#6200ee',
        fontWeight: 'bold',
    },
    scroll: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
    },
    welcomeText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1a237e',
    },
    companyText: {
        color: '#5c6bc0',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    statCard: {
        width: (width - 60) / 3,
        padding: 16,
        borderRadius: 16,
        elevation: 2,
        alignItems: 'center',
        backgroundColor: '#e3f2fd',
    },
    statIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    actionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    actionButton: {
        width: (width - 50) / 2,
    },
    actionSurface: {
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        backgroundColor: '#fff',
        elevation: 2,
    },
    actionLabel: {
        fontWeight: 'bold',
        color: '#6200ee',
    },
    recentSection: {
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    viewAll: {
        color: '#6200ee',
        fontWeight: 'bold',
    },
    bookingCard: {
        marginBottom: 12,
        elevation: 1,
        backgroundColor: '#fff',
    },
    bookingContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        backgroundColor: '#d1c4e9',
    },
    bookingInfo: {
        flex: 1,
        marginLeft: 12,
    },
    customerName: {
        fontWeight: 'bold',
        fontSize: 15,
    },
    serviceText: {
        fontSize: 12,
        color: '#777',
    },
    priceText: {
        fontWeight: 'bold',
        color: '#4caf50',
        fontSize: 16,
    },
    logoutButton: {
        marginBottom: 10,
    }
});

export default CompanyDashboardScreen;
