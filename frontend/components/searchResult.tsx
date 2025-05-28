import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

type Props = {
  item: any;
  type: 'users' | 'meals';
};

export default function SearchResultCard({ item, type }: Props) {
  return (
    <View style={styles.card}>
      {type === 'users' ? (
        <View style={styles.userRow}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
          <View style={styles.userText}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.displayName}>{item.display_name}</Text>
          </View>
        </View>
      ) : (
        <>
          <Text style={styles.bold}>{item.recipe_text}</Text>
          <Text>{item.calories} kcal</Text>
          {item.meal_image_url && (
            <Image
              source={{ uri: item.meal_image_url }}
              style={styles.image}
              resizeMode="cover"
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    height: 50,
    width: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    height: 50,
    width: 50,
    borderRadius: 25,
    backgroundColor: '#ccc',
    marginRight: 12,
  },
  userText: {
    flexDirection: 'column',
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  displayName: {
    fontSize: 14,
    color: '#666',
  },
  bold: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  image: {
    height: 150,
    width: '100%',
    marginTop: 8,
    borderRadius: 8,
  },
});
