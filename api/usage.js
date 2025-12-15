import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import admin from 'firebase-admin';

// Check if Firebase Admin is configured via Base64 service account JSON (recommended)
const hasServiceAccountBase64 = !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

// Fallback: individual env vars
const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;

console.log('[Firebase Admin - Usage] Environment check:', {
    hasServiceAccountBase64,
    hasProjectId,
    hasClientEmail,
    hasPrivateKey,
});

// Initialize Firebase Admin (singleton pattern)
let db = null;

if (!admin.apps.length) {
    try {
        let credential;

        if (hasServiceAccountBase64) {
            // RECOMMENDED: Decode Base64 service account JSON
            const serviceAccountJson = Buffer.from(
                process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
                'base64'
            ).toString('utf-8');
            const serviceAccount = JSON.parse(serviceAccountJson);
            credential = admin.credential.cert(serviceAccount);
        } else if (hasProjectId && hasClientEmail && hasPrivateKey) {
            // FALLBACK: Individual env vars
            let privateKey = process.env.FIREBASE_PRIVATE_KEY;
            privateKey = privateKey.replace(/\\n/g, '\n');
            if (privateKey.includes('\\\\n')) {
                privateKey = privateKey.replace(/\\\\n/g, '\n');
            }

            credential = admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            });
        }

        if (credential) {
            admin.initializeApp({ credential });
            db = admin.firestore();
            console.log('[Firebase Admin - Usage] Initialized successfully');
        }
    } catch (error) {
        console.error('[Firebase Admin - Usage] Initialization error:', error.message);
    }
} else {
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
            console.log('[Usage API] No db configured, returning default 100');
            return new Response(JSON.stringify({ remaining: 100 }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.split('Bearer ')[1];

        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(token);
            console.log('[Usage API] Token verified for user:', decodedToken.uid);
        } catch (error) {
            console.log('[Usage API] Token verification failed:', error.message);
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
        console.log('[Usage API] Returning remaining:', remaining, 'messageCount:', messageCount);

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
