// src/components/NetworkDebugger.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { checkNetworkConnectivity, testApiConnectivity, getBestApiUrl } from '../utils/networkUtils';
import { API_URL, FALLBACK_API_URL } from '../utils/constants';

const NetworkDebugger = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const runNetworkTests = async () => {
    setIsLoading(true);
    try {
      const results = {
        timestamp: new Date().toISOString(),
        networkConnectivity: await checkNetworkConnectivity(),
        primaryApiTest: await testApiConnectivity(API_URL),
        fallbackApiTest: await testApiConnectivity(FALLBACK_API_URL),
        bestApiUrl: await getBestApiUrl(),
      };
      setDebugInfo(results);
    } catch (error) {
      setDebugInfo({
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Debugger</Text>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={runNetworkTests}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Run Network Tests'}
        </Text>
      </TouchableOpacity>

      {debugInfo && (
        <ScrollView style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          <Text style={styles.debugText}>
            {JSON.stringify(debugInfo, null, 2)}
          </Text>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  debugText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 16,
  },
});

export default NetworkDebugger;
