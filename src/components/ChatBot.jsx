import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './ChatBot.module.css';

// Simple markdown parser for streaming content
function parseMarkdown(text) {
    if (!text) return null;

    let remaining = text;

    // Handle headings (must be at start of line)
    remaining = remaining.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    remaining = remaining.replace(/^## (.+)$/gm, '<h3>$1</h3>');
    remaining = remaining.replace(/^# (.+)$/gm, '<h2>$1</h2>');

    // Handle numbered lists
    remaining = remaining.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

    // Handle bullet points
    remaining = remaining.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');

    // Handle inline code
    remaining = remaining.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Handle bold
    remaining = remaining.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Handle italic (single asterisk - must come after bold)
    remaining = remaining.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

    // Handle line breaks (but not after block elements)
    remaining = remaining.replace(/(?<!<\/h[234]>|<\/li>)\n/g, '<br/>');

    return <span dangerouslySetInnerHTML={{ __html: remaining }} />;
}

export default function ChatBot({ tissueContext }) {
    const { user, signInWithGoogle, getIdToken } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [remaining, setRemaining] = useState(100);
    const [error, setError] = useState(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);
    const scrollIntervalRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Gentle reading-speed auto-scroll during streaming
    useEffect(() => {
        if (isStreaming && messagesContainerRef.current) {
            // Clear any existing interval
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
            }

            // Scroll at comfortable reading speed: ~4px every 50ms = 80px/sec
            scrollIntervalRef.current = setInterval(() => {
                const container = messagesContainerRef.current;
                if (container) {
                    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
                    // Only auto-scroll if user is near bottom (not scrolled up)
                    if (distanceFromBottom < 150 && distanceFromBottom > 0) {
                        container.scrollTop += 4;
                    }
                }
            }, 50);
        } else {
            // Stop scrolling when streaming ends
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
                scrollIntervalRef.current = null;
            }
        }

        return () => {
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
            }
        };
    }, [isStreaming]);

    // Reset chat when tissue changes
    useEffect(() => {
        setMessages([]);
        setError(null);
    }, [tissueContext]);

    // Fetch current usage count on mount
    useEffect(() => {
        const fetchUsage = async () => {
            if (!user) return;
            try {
                const token = await getIdToken();
                const response = await fetch('/api/usage', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setRemaining(data.remaining);
                }
            } catch (err) {
                console.error('Failed to fetch usage:', err);
            }
        };
        fetchUsage();
    }, [user, getIdToken]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        if (!user) {
            signInWithGoogle();
            return;
        }

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        // Scroll to bottom immediately when user sends message
        setTimeout(() => scrollToBottom(), 50);

        try {
            const token = await getIdToken();
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    tissueContext
                })
            });

            if (response.status === 429) {
                const data = await response.json();
                setRemaining(0);
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: "You've reached your monthly limit of 100 messages. Come back next month! 📚"
                }]);
                return;
            }

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            // Update remaining count from header
            const remainingHeader = response.headers.get('X-Messages-Remaining');
            if (remainingHeader) setRemaining(parseInt(remainingHeader));

            // Handle streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantMessage = '';

            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
            setIsStreaming(true); // Start reading-speed scroll

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                assistantMessage += chunk;

                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                        role: 'assistant',
                        content: assistantMessage
                    };
                    return newMessages;
                });
            }
        } catch (err) {
            console.error('Chat error:', err);
            setError('Something went wrong. Please try again.');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, something went wrong. Please try again later.'
            }]);
        } finally {
            setIsLoading(false);
            setIsStreaming(false); // Stop reading-speed scroll
        }
    };

    const handleInputFocus = () => {
        setIsExpanded(true);
    };

    const handleClose = (e) => {
        e.stopPropagation();
        setIsExpanded(false);
    };

    return (
        <div className={`${styles.chatContainer} ${isExpanded ? styles.expanded : ''}`}>
            {isExpanded && (
                <div className={styles.messagesArea}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <span className={styles.title}>🔬 Meded AI</span>
                            {user && (
                                <img
                                    src={user.photoURL}
                                    alt={user.displayName}
                                    className={styles.userAvatar}
                                    title={user.displayName}
                                />
                            )}
                        </div>
                        <div className={styles.headerRight}>
                            <span className={styles.remaining}>{remaining}/100</span>
                            <button onClick={handleClose} className={styles.closeBtn}>×</button>
                        </div>
                    </div>
                    <div className={styles.messages} ref={messagesContainerRef}>
                        {messages.length === 0 && (
                            <div className={styles.welcomeMessage}>
                                <div className={styles.welcomeIcon}>🧬</div>
                                <p>Ask me anything about <strong>{tissueContext?.split('\n')[0]?.replace('Tissue: ', '') || 'this tissue'}</strong>!</p>
                                <p className={styles.welcomeHint}>I can explain features, functions, clinical correlations, and exam tips.</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
                                {msg.role === 'assistant' ? parseMarkdown(msg.content) : msg.content}
                            </div>
                        ))}
                        {isLoading && (
                            <div className={styles.typing}>
                                <span></span><span></span><span></span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className={styles.inputArea}>
                <input
                    ref={inputRef}
                    id="chat-message-input"
                    name="chat-message"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={handleInputFocus}
                    placeholder={user ? "Ask about this tissue..." : "Sign in to ask questions..."}
                    className={styles.input}
                    disabled={remaining === 0}
                />
                <button
                    type="submit"
                    className={styles.sendBtn}
                    disabled={isLoading || remaining === 0}
                >
                    {!user ? (
                        <span className={styles.lockIcon}>🔐</span>
                    ) : isLoading ? (
                        <span className={styles.loadingDots}>...</span>
                    ) : (
                        <span className={styles.sendIcon}>→</span>
                    )}
                </button>
            </form>
        </div>
    );
}
