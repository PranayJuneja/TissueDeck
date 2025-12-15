import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import admin from 'firebase-admin';

// Check if Firebase Admin is configured
const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;

console.log('[Firebase Admin - Usage] Environment check:', {
    hasProjectId,
    hasClientEmail,
    hasPrivateKey,
    privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0
});

const isFirebaseAdminConfigured = hasProjectId && hasClientEmail && hasPrivateKey;

// Initialize Firebase Admin (singleton pattern)
let db = null;

if (isFirebaseAdminConfigured && !admin.apps.length) {
    try {
        // Handle different escape formats for private key
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        // Replace literal \n with actual newlines
        privateKey = privateKey.replace(/\\n/g, '\n');
        // Also handle if it was JSON stringified (double escaped)
        if (privateKey.startsWith('"')) {
            try {
                privateKey = JSON.parse(privateKey);
            } catch (e) {
                // Not JSON, use as-is
            }
        }

        console.log('[Firebase Admin - Usage] Private key format check:', {
            startsWithBegin: privateKey.startsWith('-----BEGIN'),
            endsWithEnd: privateKey.includes('-----END'),
            hasNewlines: privateKey.includes('\n'),
            length: privateKey.length
        });

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
        db = admin.firestore();
        console.log('[Firebase Admin - Usage] Initialized successfully');
    } catch (error) {
        console.error('[Firebase Admin - Usage] Initialization error:', error.message);
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
