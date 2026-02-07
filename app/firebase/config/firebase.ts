import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyBTSwwIMmus14z-mTdZXVQMoGdYYRhreQk",
  authDomain: "ai-skills-extraction.firebaseapp.com",
  projectId: "ai-skills-extraction",
  storageBucket: "ai-skills-extraction.firebasestorage.app",
  messagingSenderId: "782538929774",
  appId: "1:782538929774:web:d49d0661e9309e73b5987f"
}

// Check if all required Firebase config values are present
const isFirebaseConfigured =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId

let app: any = null
let db: any = null
let auth: any = null

if (isFirebaseConfigured) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
  db = getFirestore(app)
  auth = getAuth(app)
} else {
  console.warn('Firebase configuration is incomplete. Some features may not work.')
}

export { app, db, auth, firebaseConfig }
