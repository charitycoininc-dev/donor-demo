import React, { useEffect, useState } from 'react';
import { db, auth } from '../stores/config/firebase';

export default function TestPage() {
  const [status, setStatus] = useState('Loading...');
  const [firebaseStatus, setFirebaseStatus] = useState('Checking...');

  useEffect(() => {
    // Test basic app functionality
    setStatus('App loaded successfully!');
    
    // Test Firebase connection
    if (db && auth) {
      setFirebaseStatus('Firebase initialized successfully');
    } else {
      setFirebaseStatus('Firebase initialization failed');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            App Status Test
          </h1>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800">App Status</h3>
              <p className="text-green-700">{status}</p>
            </div>
            
            <div className={`p-4 border rounded-lg ${
              firebaseStatus.includes('successfully') 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <h3 className="font-semibold">Firebase Status</h3>
              <p className={firebaseStatus.includes('successfully') ? 'text-green-700' : 'text-red-700'}>
                {firebaseStatus}
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800">Environment Variables</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>VITE_FIREBASE_API_KEY: {import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}</p>
                <p>VITE_FIREBASE_AUTH_DOMAIN: {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing'}</p>
                <p>VITE_FIREBASE_PROJECT_ID: {import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing'}</p>
                <p>VITE_FIREBASE_STORAGE_BUCKET: {import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing'}</p>
                <p>VITE_FIREBASE_MESSAGING_SENDER_ID: {import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing'}</p>
                <p>VITE_FIREBASE_APP_ID: {import.meta.env.VITE_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing'}</p>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800">Build Info</h3>
              <div className="text-sm text-yellow-700 space-y-1">
                <p>Mode: {import.meta.env.MODE}</p>
                <p>Base URL: {import.meta.env.BASE_URL}</p>
                <p>User Agent: {navigator.userAgent}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <a 
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-deep-red-600 hover:bg-deep-red-700"
            >
              Go to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 