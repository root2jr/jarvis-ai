import firebase from "firebase/app";
import "firebase/messaging";

// Your Firebase config object
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

firebase.initializeApp(firebaseConfig);

// Get the messaging instance
const messaging = firebase.messaging();
async function getFCMToken() {
    try {
      // Request permission to send notifications
      await Notification.requestPermission();
  
      // Get the FCM token
      const token = await messaging.getToken({
        vapidKey: "YOUR_VAPID_KEY",  // You can generate this from Firebase Cloud Messaging settings
      });
  
      if (token) {
        console.log("FCM Token:", token);
        // Now you can send this token to your backend to store it
        sendFCMTokenToBackend(token);
      } else {
        console.log("No FCM token available");
      }
    } catch (error) {
      console.error("Error getting FCM token:", error);
    }
  }
  async function sendFCMTokenToBackend(token) {
    try {
      const response = await axios.post("http://your-backend-url.com/store-fcm-token", {
        token,
        userId: yourUserId, 
      });
      console.log(response.data);
    } catch (error) {
      console.error("Error sending FCM token to backend:", error);
    }
  }
    