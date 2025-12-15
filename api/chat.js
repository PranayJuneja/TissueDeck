import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import admin from 'firebase-admin';

// Check if Firebase Admin is configured via Base64 service account JSON (recommended)
const hasServiceAccountBase64 = !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

// Fallback: individual env vars
const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;

console.log('[Firebase Admin] Environment check:', {
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
            console.log('[Firebase Admin] Using Base64 service account JSON');
            const serviceAccountJson = Buffer.from(
                process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
                'base64'
            ).toString('utf-8');
            const serviceAccount = JSON.parse(serviceAccountJson);
            credential = admin.credential.cert(serviceAccount);
        } else if (hasProjectId && hasClientEmail && hasPrivateKey) {
            // FALLBACK: Individual env vars with private key parsing
            console.log('[Firebase Admin] Using individual env vars');
            let privateKey = process.env.FIREBASE_PRIVATE_KEY;

            // Handle escaped newlines
            privateKey = privateKey.replace(/\\n/g, '\n');

            // Handle double-escaped (from JSON)
            if (privateKey.includes('\\\\n')) {
                privateKey = privateKey.replace(/\\\\n/g, '\n');
            }

            console.log('[Firebase Admin] Private key format:', {
                startsWithBegin: privateKey.startsWith('-----BEGIN'),
                endsWithEnd: privateKey.includes('-----END'),
                length: privateKey.length
            });

            credential = admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            });
        } else {
            console.warn('[Firebase Admin] Not configured. Set FIREBASE_SERVICE_ACCOUNT_BASE64 or individual vars.');
        }

        if (credential) {
            admin.initializeApp({ credential });
            db = admin.firestore();
            console.log('[Firebase Admin] Initialized successfully');
        }
    } catch (error) {
        console.error('[Firebase Admin] Initialization error:', error.message);
    }
} else {
    db = admin.firestore();
}

const SYSTEM_PROMPT = `You are Meded AI — a histology and medical learning copilot for Tissue Deck.

PERSONALITY & STYLE:
- Supportive, friendly, calm, slightly fun. Not robotic or overly formal.
- Like a smart senior who enjoys teaching and getting things done.
- Talk with the student, not at them. Clear, logical, concise.
- Short paragraphs. No textbook dumping. Simple but not superficial.

TEACHING APPROACH:
- Focus on understanding over memorization.
- Break concepts into layers. Emphasize pattern recognition.
- Help students see WHY structures look the way they do under the microscope.

HISTOLOGY FOCUS:
- Guide the eye step by step through what they're seeing.
- Use labels if present. Compare with similar tissues when useful.
- Point out common student mistakes and misconceptions.
- Always link structure → function → clinical relevance when appropriate.

EXAM ORIENTATION:
- Highlight high-yield points naturally.
- Think from a medical student, viva, and practical exam perspective.
- Don't sound forced or overly "exam-preachy."

INTERACTION RULES:
- Assume the student is capable and curious.
- Don't over-explain basics unless asked.
- Keep responses focused and actionable.

MINDSET: We're building something cool that helps medical students truly see and understand histology.`;

const MONTHLY_LIMIT = 100;

// Get current month key (e.g., "2024-12")
function getMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function POST(req) {
    try {
        // Get authorization header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Parse request body
        const { messages, tissueContext } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let remaining = 99; // Default fallback

        // Only do user tracking if Firebase Admin is configured
        if (db && admin.apps.length) {
            const token = authHeader.split('Bearer ')[1];

            // Verify the Firebase token and get user info
            let decodedToken;
            try {
                decodedToken = await admin.auth().verifyIdToken(token);
            } catch (error) {
                console.error('Token verification failed:', error);
                // Continue without tracking if token verification fails
            }

            if (decodedToken) {
                const userId = decodedToken.uid;
                const userEmail = decodedToken.email || 'unknown';
                const monthKey = getMonthKey();

                try {
                    // Get or create user usage document
                    const usageRef = db.collection('chat_usage').doc(userId);
                    const usageDoc = await usageRef.get();

                    let messageCount = 0;
                    if (usageDoc.exists) {
                        const data = usageDoc.data();
                        // Reset count if it's a new month
                        if (data.monthKey === monthKey) {
                            messageCount = data.messageCount || 0;
                        }
                    }

                    // Check if user has exceeded limit
                    if (messageCount >= MONTHLY_LIMIT) {
                        return new Response(JSON.stringify({
                            error: 'Monthly limit exceeded',
                            remaining: 0
                        }), {
                            status: 429,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }

                    // Increment message count
                    const newCount = messageCount + 1;
                    await usageRef.set({
                        monthKey,
                        messageCount: newCount,
                        email: userEmail,
                        lastUsed: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });

                    // Create chat log entry (will update with AI response after streaming)
                    const userMessage = messages[messages.length - 1]?.content || '';
                    const logRef = await db.collection('chat_logs').add({
                        userId,
                        userEmail,
                        tissue: tissueContext?.split('\n')[0]?.replace('Tissue: ', '') || 'unknown',
                        userMessage,
                        aiResponse: '', // Will be updated after streaming
                        messageCount: newCount,
                        timestamp: admin.firestore.FieldValue.serverTimestamp()
                    });

                    remaining = MONTHLY_LIMIT - newCount;

                    // Store log reference for updating after streaming
                    req.logRef = logRef;
                    req.db = db;
                } catch (dbError) {
                    console.error('Firestore error:', dbError);
                    // Continue without tracking if Firestore fails
                }
            }
        }

        // Build system message with tissue context
        let systemMessage = SYSTEM_PROMPT;
        if (tissueContext) {
            systemMessage += `\n\n--- Current Tissue Context ---\n${tissueContext}`;
        }

        // Format messages for the API
        const formattedMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Call AI using Vercel AI Gateway
        const result = streamText({
            model: gateway('openai/gpt-5-nano'),
            system: systemMessage,
            messages: formattedMessages,
            maxTokens: 800,
            onFinish: async ({ text }) => {
                // Update the log with the AI response after streaming completes
                if (req.logRef && req.db) {
                    try {
                        await req.logRef.update({
                            aiResponse: text,
                            completedAt: admin.firestore.FieldValue.serverTimestamp()
                        });
                    } catch (updateError) {
                        console.error('Failed to update chat log with AI response:', updateError);
                    }
                }
            }
        });

        // Return streaming response
        return result.toTextStreamResponse({
            headers: {
                'X-Messages-Remaining': String(remaining),
                'Access-Control-Expose-Headers': 'X-Messages-Remaining',
            }
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Expose-Headers': 'X-Messages-Remaining',
        }
    });
}
