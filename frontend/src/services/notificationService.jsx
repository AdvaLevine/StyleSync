const NOTIFICATION_STORAGE_KEY = 'last_notification_sent';
const TIPS_API_ENDPOINT = 'https://wq0b4viqpb.execute-api.us-east-1.amazonaws.com/dev/getAITipsForItems';
const SMS_API_ENDPOINT = 'https://5fe2df9eif.execute-api.us-east-1.amazonaws.com/dev/smsHandler';

class NotificationService {
  constructor() {
    this.isProcessing = false;
  }

  // Check if we should send notification today
  shouldSendNotification() {
    const lastSent = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    const today = new Date().toDateString();
    
    return !lastSent || lastSent !== today;
  }

  // Get user preferences
  getUserPreferences() {
    try {
      const preferences = localStorage.getItem("user_preferences");
      if (preferences) {
        return JSON.parse(preferences);
      }
      return { notifications: false };
    } catch (error) {
      console.error("Error parsing user preferences:", error);
      return { notifications: false };
    }
  }

  // Get user phone number
  getUserPhoneNumber() {
    return localStorage.getItem("user_phone") || "";
  }

  // Get all user items for tips generation
  async getAllUserItems() {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      throw new Error("User ID not found");
    }

    try {
      const response = await fetch(`https://n44pfzmdl8.execute-api.us-east-1.amazonaws.com/dev/get-all-items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user items");
      }

      const data = await response.json();
      return JSON.parse(data.body).map((item, index) => ({
        index,
        itemtype: item.itemtype,
        color: item.color,
        weather: item.weather,
        style: item.style,
        url: item.photo_url,
        item_description: item.item_description
      }));
    } catch (error) {
      console.error("Error fetching user items:", error);
      throw error;
    }
  }

  // Get tips from AI service
  async getTipsFromAI(userItems) {
    try {
      const response = await fetch(TIPS_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: localStorage.getItem("user_id"),
          wardrobe_items: userItems
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get tips from AI:", response);
      }

      const data = await response.json();
      // Handle Lambda response format
      if (response.status === 200) {
        console.log("Message: " , data.message)
        return data.message || "Stay stylish today! 💫";
      } else {
        throw new Error("AI service returned error");
      }
    } catch (error) {
      console.error("Error getting tips from AI:", error);
      // Fallback message
      return "Here's a style tip: Mix and match different textures in your outfit to create visual interest! ✨";
    }
  }

  // Send SMS notification
  async sendSMSNotification(phoneNumber, message) {
    try {
      const response = await fetch(SMS_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          message: message
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send SMS");
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending SMS:", error);
      throw error;
    }
  }

  // Mark notification as sent today
  markNotificationSent() {
    const today = new Date().toDateString();
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, today);
  }

  // Main function to process daily notification
  async processDailyNotification() {
    // Prevent multiple simultaneous calls
    if (this.isProcessing) {
      console.log("Notification processing already in progress");
      return;
    }

    this.isProcessing = true;

    try {
      // Check if user has notifications enabled
      const preferences = this.getUserPreferences();
      if (!preferences.notifications) {
        console.log("Notifications disabled by user");
        return;
      }

      // Check if we already sent notification today
      if (!this.shouldSendNotification()) {
        console.log("Notification already sent today");
        return;
      }

      // Get user phone number
      const phoneNumber = this.getUserPhoneNumber();
      if (!phoneNumber) {
        console.log("No phone number found for user");
        return;
      }

      console.log("Processing daily notification...");

      // Get user items
      const userItems = await this.getAllUserItems();
      
      // If user has no items, skip notification
      if (userItems.length === 0) {
        console.log("User has no items, skipping notification");
        return;
      }

      // Get tips from AI
      //const tipMessage = await this.getTipsFromAI(userItems);
      const tipMessage = "test"
      // Add StyleSync branding to message
      const fullMessage = `StyleSync Daily Tip: ${tipMessage}`;

      // Send SMS
      await this.sendSMSNotification(phoneNumber, fullMessage);

      // Mark as sent
      this.markNotificationSent();

      console.log("Daily notification sent successfully");
      
    } catch (error) {
      console.error("Error processing daily notification:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Force send notification (for testing)
  async forceSendNotification() {
    // Clear the last sent flag to force sending
    localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
    await this.processDailyNotification();
  }
}

export const notificationService = new NotificationService();
export default notificationService;