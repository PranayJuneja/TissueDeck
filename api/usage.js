import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import admin from 'firebase-admin';

// Check if Firebase Admin is configured
const isFirebaseAdminConfigured =
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY;

// Initialize Firebase Admin (singleton pattern)
let db = null;

if (isFirebaseAdminConfigured && !admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
        });
        db = admin.firestore();
    } catch (error) {
        console.error('Firebase Admin initialization error:', error);
    }
} else if (admin.apps.length) {
    db = admin.firestore();
}

const MONTHLY_LIMIT = 100;

function getMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function GET(req) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!db || !admin.apps.length) {
            // Return default if Firebase not configured
            return new Response(JSON.stringify({ remaining: 100 }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.split('Bearer ')[1];

        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(token);
        } catch (error) {
            return new Response(JSON.stringify({ remaining: 100 }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const userId = decodedToken.uid;
        const monthKey = getMonthKey();

        const usageRef = db.collection('chat_usage').doc(userId);
        const usageDoc = await usageRef.get();

        let messageCount = 0;
        if (usageDoc.exists) {
            const data = usageDoc.data();
            if (data.monthKey === monthKey) {
                messageCount = data.messageCount || 0;
            }
        }

        const remaining = Math.max(0, MONTHLY_LIMIT - messageCount);

        return new Response(JSON.stringify({ remaining }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Usage API error:', error);
        return new Response(JSON.stringify({ remaining: 100 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
