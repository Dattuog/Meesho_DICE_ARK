import api from './api';

class NotificationService {
  constructor() {
    this.notifications = [];
    this.subscribers = [];
    this.isSupported = 'Notification' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  // Subscribe to flash sale notifications
  async subscribeToFlashSales(userLocation) {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('Notification permission denied');
      }

      // Register user for flash sale notifications with their location
      await api.post('/api/v1/notifications/subscribe', {
        type: 'FLASH_SALE',
        location: userLocation,
        userId: 'USER001' // In real app, get from auth context
      });

      console.log('Successfully subscribed to flash sale notifications');
      return true;
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
      throw error;
    }
  }

  // Show flash sale notification
  showFlashSaleNotification(flashSaleData) {
    if (!this.isSupported || this.permission !== 'granted') {
      console.warn('Cannot show notification - permission not granted');
      return;
    }

    const { item, distance, timeLeft, originalPrice, flashSalePrice } = flashSaleData;
    
    const notification = new Notification('🚀 Flash Sale Alert!', {
      body: `${item.product_name} is available nearby (${distance}km away) for ₹${flashSalePrice} (was ₹${originalPrice})`,
      icon: item.image_urls?.[0] || '/favicon.ico',
      badge: '/favicon.ico',
      tag: `flash-sale-${item.order_item_id}`,
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View Item'
        },
        {
          action: 'close',
          title: 'Dismiss'
        }
      ],
      data: {
        flashSaleId: item.flash_sale_id,
        itemId: item.order_item_id,
        url: `/flash-sales/${item.flash_sale_id}`
      }
    });

    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      window.location.href = `/flash-sales/${item.flash_sale_id}`;
      notification.close();
    };

    notification.onclose = () => {
      console.log('Notification closed');
    };

    // Auto close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);

    return notification;
  }

  // Poll for new flash sales (simulates real-time notifications)
  startFlashSalePolling(userLocation, interval = 30000) {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(async () => {
      try {
        const response = await api.get('/api/v1/flash-sales/nearby', {
          params: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            limit: 10
          }
        });

        // Check for new flash sales
        const newFlashSales = response.data.flashSales?.filter(sale => 
          !this.notifiedSales?.includes(sale.flash_sale_id)
        ) || [];

        if (newFlashSales.length > 0) {
          // Show notifications for new flash sales
          newFlashSales.forEach(sale => {
            this.showFlashSaleNotification({
              item: sale,
              distance: sale.distance,
              timeLeft: sale.timeLeft,
              originalPrice: sale.original_price,
              flashSalePrice: sale.flash_sale_price
            });
          });

          // Track notified sales to avoid duplicates
          this.notifiedSales = [
            ...(this.notifiedSales || []),
            ...newFlashSales.map(sale => sale.flash_sale_id)
          ];
        }
      } catch (error) {
        console.error('Failed to poll for flash sales:', error);
      }
    }, interval);
  }

  stopFlashSalePolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Get user's notification preferences
  async getNotificationPreferences() {
    try {
      const response = await api.get('/api/v1/notifications/preferences');
      return response.data;
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      return {
        flashSalesEnabled: true,
        priceRange: { min: 0, max: 10000 },
        categories: []
      };
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences) {
    try {
      await api.put('/api/v1/notifications/preferences', preferences);
      return true;
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  // Get notification history
  async getNotificationHistory() {
    try {
      const response = await api.get('/api/v1/notifications/history');
      return response.data.notifications || [];
    } catch (error) {
      console.error('Failed to get notification history:', error);
      return [];
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;