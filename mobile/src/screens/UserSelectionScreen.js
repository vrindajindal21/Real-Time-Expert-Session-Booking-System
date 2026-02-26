import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions
} from 'react-native';
import { Surface, Title, Paragraph } from 'react-native-paper';

const { width } = Dimensions.get('window');

const UserSelectionScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Title style={styles.heroTitle}>Welcome to ExpertBooking</Title>
                <Paragraph style={styles.heroSubtitle}>Choose how you want to continue</Paragraph>
            </View>

            <View style={styles.choices}>
                <TouchableOpacity
                    style={styles.choiceCard}
                    onPress={() => navigation.replace('ExpertList', { role: 'user' })}
                >
                    <Surface style={styles.surface}>
                        <Text style={styles.icon}>🔍</Text>
                        <Title style={styles.cardTitle}>I'm a User</Title>
                        <Paragraph style={styles.cardInfo}>Find experts and book a session in seconds.</Paragraph>
                    </Surface>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.choiceCard}
                    onPress={() => navigation.replace('CompanyDashboard', { role: 'company', companyId: 'city_hospital' })}
                >
                    <Surface style={[styles.surface, { borderColor: '#4caf50' }]}>
                        <Text style={styles.icon}>💼</Text>
                        <Title style={styles.cardTitle}>I'm a Company</Title>
                        <Paragraph style={styles.cardInfo}>List your services and manage your bookings.</Paragraph>
                    </Surface>
                </TouchableOpacity>
            </View>

            <Text style={styles.footer}>The smartest way to book professional services.</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#6200ee',
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#666',
    },
    choices: {
        gap: 20,
    },
    choiceCard: {
        width: '100%',
    },
    surface: {
        padding: 24,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#6200ee',
        elevation: 4,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    icon: {
        fontSize: 48,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    cardInfo: {
        textAlign: 'center',
        color: '#777',
        marginTop: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        color: '#bbb',
        fontSize: 12,
    }
});

export default UserSelectionScreen;
