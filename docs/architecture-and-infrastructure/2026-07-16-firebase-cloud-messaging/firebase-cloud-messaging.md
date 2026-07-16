# Firebase Cloud Messaging (FCM) Integration

## Overview
This document outlines the architecture and setup for Push Notifications on the Kwickly platform, implemented in Epic **Platform-M9: PWA & Web Push Notifications**.

Kwickly relies on **Firebase Cloud Messaging (FCM)** as its centralized push notification broker. FCM was chosen over raw VAPID because it provides a unified API capable of delivering notifications not just to web PWAs, but also to native iOS (via APNs) and Android apps (which is critical for the upcoming Platform-M8 Customer Mobile App).

## Architecture

1. **`kwickly-api` (Backend)**: 
   - Uses `firebase-admin` to securely authenticate with Google servers using a Service Account Private Key.
   - Exposes REST endpoints to register and unregister device tokens (`/v1/notifications/push/register`).
   - Stores device tokens in the `fcm_tokens` Postgres table.
   - Sends targeted messages using the FCM Admin SDK.

2. **Frontends (`kwickly-admin-web` & `kwickly-client`)**:
   - Uses `firebase/messaging` client SDK.
   - Registers a service worker (`firebase-messaging-sw.js`) to receive background messages when the app is closed.
   - Requests Notification Permissions from the user.
   - Exchanges the VAPID Public Key with Firebase to retrieve a unique Device Token.
   - Sends the Device Token to the `kwickly-api` for storage.

## Required Environment Variables

### Backend (`kwickly-api`)
```env
# A stringified JSON of the Firebase Service Account Key.
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

### Frontends (`kwickly-client` & `kwickly-admin-web`)
```env
# These values are found in the Firebase Console -> Project Settings -> General -> Web App
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."

# The VAPID Public Key from Firebase Console -> Project Settings -> Cloud Messaging
NEXT_PUBLIC_FIREBASE_VAPID_KEY="..."
```
*(Note: Replace `NEXT_PUBLIC_` with `VITE_` for the Vite-based admin-web).*

## Local Setup & Testing
1. **Secure Context**: FCM requires a secure context. You must run the frontends on `localhost` or serve them over HTTPS (e.g., using `ngrok`).
2. **Service Workers**: Ensure your browser has service workers enabled and is not aggressively blocking background activity (incognito mode often blocks service workers).
3. **Database**: Run standard migrations to apply the `fcm_tokens` schema.
