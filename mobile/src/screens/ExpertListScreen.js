import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Card, Button, Chip, Searchbar, Divider } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import api from '../config/api';

const ExpertListScreen = ({ navigation }) => {
  const [experts, setExperts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories);
    } catch (err) {
      console.error('Error categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [experts]);

  const fetchExperts = useCallback(async (pageNum = 1, search = '', category = '', isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const params = {
        page: pageNum,
        limit: 10,
      };

      if (search) params.search = search;
      if (category && category !== 'All') params.category = category;

      const response = await api.get('/experts', { params });

      if (isRefresh || pageNum === 1) {
        setExperts(response.data.experts);
      } else {
        setExperts(prev => [...prev, ...response.data.experts]);
      }

      setPagination(response.data.pagination);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching experts:', error);
      Alert.alert('Error', 'Failed to fetch experts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchExperts(1, searchQuery, selectedCategory);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchExperts(1, searchQuery, selectedCategory, true);
  };

  const onSearch = (query) => {
    setSearchQuery(query);
    fetchExperts(1, query, selectedCategory, true);
  };

  const onCategoryChange = (category) => {
    setSelectedCategory(category);
    fetchExperts(1, searchQuery, category, true);
  };

  const loadMoreExperts = () => {
    if (pagination && page < pagination.pages && !loadingMore) {
      setLoadingMore(true);
      fetchExperts(page + 1, searchQuery, selectedCategory);
    }
  };

  const renderExpert = ({ item }) => (
    <Card style={styles.card}>
      <TouchableOpacity
        onPress={() => navigation.navigate('ExpertDetail', { expertId: item._id })}
      >
        <Card.Content>
          <View style={styles.header}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.rating}>
              <Text style={styles.ratingText}>⭐ {item.rating.toFixed(1)}</Text>
            </View>
          </View>

          <Chip style={styles.category}>{item.category}</Chip>

          <Text style={styles.experience}>{item.experience} years experience</Text>

          <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
        <Text>Loading experts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search experts..."
          onChangeText={onSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <View style={styles.categories}>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Chip
              style={[
                styles.categoryChip,
                selectedCategory === item && styles.selectedCategory
              ]}
              onPress={() => onCategoryChange(item)}
            >
              {item}
            </Chip>
          )}
        />
      </View>

      <FlatList
        data={experts}
        renderItem={renderExpert}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        onEndReached={loadMoreExperts}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>No services found</Text>
          </View>
        }
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: '#4caf50' }]}
          onPress={() => navigation.navigate('ManageResource')}
        >
          <Text style={styles.buttonText}>Manage</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => navigation.navigate('MyBookings')}
        >
          <Text style={styles.buttonText}>My Bookings</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  searchSection: {
    padding: 16,
    backgroundColor: 'white',
  },
  searchBar: {
    elevation: 2,
  },
  categories: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryChip: {
    marginRight: 8,
  },
  selectedCategory: {
    backgroundColor: '#6200ee',
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
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  rating: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
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
  bio: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  loadingMore: {
    padding: 16,
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
  },
  floatingButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    marginLeft: 10,
    elevation: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ExpertListScreen;
