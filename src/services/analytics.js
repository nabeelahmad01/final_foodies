// Expo Go safe analytics shim (no Firebase in Expo Go)
// In production builds, replace this with a real analytics implementation
// such as @react-native-firebase/analytics or expo-firebase-analytics.
class Analytics {
  // Track screen views
  static async logScreenView(screenName, screenClass = null) {
    if (__DEV__) console.log('[Analytics] screen_view', { screenName, screenClass });
  }

  // Track events
  static async logEvent(eventName, params = {}) {
    if (__DEV__) console.log('[Analytics] event', eventName, params);
  }

  // E-commerce events
  static async logViewItem(item) {
    await this.logEvent('view_item', {
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
    });
  }

  static async logAddToCart(item, quantity = 1) {
    await this.logEvent('add_to_cart', {
      item_id: item.id,
      item_name: item.name,
      quantity,
      price: item.price,
      value: item.price * quantity,
    });
  }

  static async logBeginCheckout(totalAmount, items) {
    await this.logEvent('begin_checkout', {
      value: totalAmount,
      currency: 'PKR',
      items_count: items.length,
    });
  }

  static async logPurchase(orderId, totalAmount, items) {
    await this.logEvent('purchase', {
      transaction_id: orderId,
      value: totalAmount,
      currency: 'PKR',
      items_count: items.length,
    });
  }

  // User actions
  static async logLogin(method) {
    await this.logEvent('login', { method });
  }

  static async logSignUp(method) {
    await this.logEvent('sign_up', { method });
  }

  static async logSearch(searchTerm) {
    await this.logEvent('search', { search_term: searchTerm });
  }

  static async logShare(contentType, itemId) {
    await this.logEvent('share', {
      content_type: contentType,
      item_id: itemId,
    });
  }

  // Set user properties
  static async setUserProperties(properties) {
    if (__DEV__) console.log('[Analytics] setUserProperties', properties);
  }

  // Set user ID
  static async setUserId(userId) {
    if (__DEV__) console.log('[Analytics] setUserId', userId);
  }
}

export default Analytics;
