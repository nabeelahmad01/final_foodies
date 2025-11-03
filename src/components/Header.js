import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../styles/colors';

const Header = ({ title, onBack, rightIcon, onRightPress, style }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        {onBack ? (
          <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
            <Icon name="arrow-back" size={22} color={colors.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.right}>
        {rightIcon ? (
          <TouchableOpacity style={styles.iconBtn} onPress={onRightPress}>
            <Icon name={rightIcon} size={22} color={colors.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: colors.primary,
  },
  left: { width: 40 },
  right: { width: 40, alignItems: 'flex-end' },
  placeholder: { width: 40 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    marginHorizontal: 12,
    textAlign: 'center',
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Header;
