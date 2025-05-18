import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';

const INCIDENTS = [
  {
    id: '1',
    time: '2025-05-16 12:34 PM',
    location: 'Ang Mo Kio Ave 3',
    type: 'Flood',
    status: 'Pending',
    description: 'Heavy flooding reported, avoid the area.',
  },
  {
    id: '2',
    time: '2025-05-16 11:15 AM',
    location: 'Jurong West St 42',
    type: 'Power Outage',
    status: 'Resolved',
    description: 'Electricity restored after 2 hours of outage.',
  },
  {
    id: '3',
    time: '2025-05-16 10:00 AM',
    location: 'Tampines MRT',
    type: 'Suspicious Package',
    status: 'Pending',
    description: 'Police cordoned off area for investigation.',
  },
  {
    id: '4',
    time: '2025-05-16 09:45 AM',
    location: 'Pasir Ris Park',
    type: 'Wild Animal Sighting',
    status: 'Resolved',
    description: 'Python spotted, animal control intervened.',
  },
];

export default function IncidentFeedScreen() {
  const handlePress = (incident: any) => {
    Alert.alert(incident.type, incident.description);
  };

  const renderIncident = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => handlePress(item)} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.type}>{item.type}</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === 'Resolved' ? '#22c55e' : '#facc15',
            },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.location}>📍 {item.location}</Text>
      <Text style={styles.time}>🕒 {item.time}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📢 Live Incident Feed</Text>
      <FlatList
        data={INCIDENTS}
        keyExtractor={(item) => item.id}
        renderItem={renderIncident}
        contentContainerStyle={styles.feed}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: '#1e293b',
  },
  feed: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  type: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  location: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  time: {
    fontSize: 13,
    color: '#64748b',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },
});
