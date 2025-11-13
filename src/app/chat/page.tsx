'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CrawlData {
  keyword: string;
  siteDomain: string;
  urls: string[];
  summary: string;
  _id: string;
}

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const keywordId = searchParams.get('id');
  
  const [crawlData, setCrawlData] = useState<CrawlData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage
  const loadMessagesFromStorage = (id: string) => {
    setLoadingMessages(true);
    try {
      const stored = localStorage.getItem(`chat_${id}`);
      if (stored) {
        const parsedMessages = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsedMessages.map((msg: Message) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(messagesWithDates);
      }
    } catch (error) {
      console.error('Error loading messages from localStorage:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Save messages to localStorage
  const saveMessagesToStorage = (id: string, msgs: Message[]) => {
    try {
      localStorage.setItem(`chat_${id}`, JSON.stringify(msgs));
    } catch (error) {
      console.error('Error saving messages to localStorage:', error);
    }
  };

  useEffect(() => {
    if (keywordId) {
      loadCrawlData(keywordId);
      loadMessagesFromStorage(keywordId);
    } else {
      router.push('/');
    }
  }, [keywordId, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isLoading) {
      scrollToBottom();
    }
  }, [isLoading]);

  useEffect(() => {
    if (!loadingData && messages.length > 0) {
      // Scroll to bottom after data is loaded
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    }
  }, [loadingData, messages.length]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const loadCrawlData = async (id: string) => {
    try {
      setLoadingData(true);
      const res = await fetch(`/api/keyword/full?id=${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        setCrawlData(data);
      }
    } catch (error) {
      console.error('Failed to load crawl data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !keywordId || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveMessagesToStorage(keywordId, updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/discussion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywordId: keywordId,
          user_prompt: inputMessage,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get response');
      }

      const data = await res.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message || 'No response received',
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      saveMessagesToStorage(keywordId, finalMessages);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      saveMessagesToStorage(keywordId, finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!crawlData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Failed to load crawl data</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-700/50 backdrop-blur-sm bg-gray-900/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Chat Discussion
              </h1>
              <p className="text-sm text-gray-400">
                {crawlData?.keyword || 'Loading...'}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            {crawlData?.urls?.length || 0} URLs crawled
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Crawl Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4 text-gray-200 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Crawl Summary
              </h2>
              <div className="prose prose-invert prose-sm prose-headings:text-white prose-strong:text-white max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({...props}) => <h1 className="text-lg font-bold text-white mb-2 mt-4" {...props} />,
                    h2: ({...props}) => <h2 className="text-base font-bold text-white mb-2 mt-3" {...props} />,
                    h3: ({...props}) => <h3 className="text-sm font-semibold text-white mb-1 mt-2" {...props} />,
                    strong: ({...props}) => <strong className="font-bold text-white" {...props} />,
                    p: ({...props}) => <p className="text-gray-200 mb-2 leading-relaxed text-sm" {...props} />,
                    ul: ({...props}) => <ul className="list-disc list-inside mb-2 space-y-1 text-gray-200 text-sm" {...props} />,
                    ol: ({...props}) => <ol className="list-decimal list-inside mb-2 space-y-1 text-gray-200 text-sm" {...props} />,
                    li: ({...props}) => <li className="text-gray-200 ml-2 text-sm" {...props} />,
                  }}
                >
                  {crawlData?.summary || 'Loading summary...'}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Right Side - Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-xl flex flex-col h-[calc(100vh-10rem)]">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                      <p className="text-gray-400">Loading previous chat messages...</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-gray-400">Ask questions about the crawled data</p>
                      <p className="text-gray-500 text-sm mt-2">Example: &quot;What are the services in SLT Mobitel?&quot;</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700/50 border border-gray-600/50 text-gray-100'
                          }`}
                        >
                          {message.role === 'assistant' ? (
                            <div className="prose prose-invert prose-sm max-w-none">
                              <ReactMarkdown
                                components={{
                                  h1: ({...props}) => <h1 className="text-xl font-bold text-white mb-3 mt-4" {...props} />,
                                  h2: ({...props}) => <h2 className="text-lg font-bold text-white mb-2 mt-3" {...props} />,
                                  h3: ({...props}) => <h3 className="text-base font-semibold text-white mb-2 mt-2" {...props} />,
                                  h4: ({...props}) => <h4 className="text-sm font-semibold text-white mb-1 mt-2" {...props} />,
                                  p: ({...props}) => <p className="text-gray-100 mb-3 leading-relaxed" {...props} />,
                                  strong: ({...props}) => <strong className="font-bold text-white" {...props} />,
                                  em: ({...props}) => <em className="italic text-gray-200" {...props} />,
                                  ul: ({...props}) => <ul className="list-disc list-inside mb-3 space-y-1 text-gray-100 ml-2" {...props} />,
                                  ol: ({...props}) => <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-100 ml-2" {...props} />,
                                  li: ({...props}) => <li className="text-gray-100 leading-relaxed" {...props} />,
                                  code: ({...props}) => <code className="bg-gray-800/80 px-2 py-0.5 rounded text-blue-300 text-sm font-mono" {...props} />,
                                  pre: ({...props}) => <pre className="bg-gray-800/80 p-4 rounded-lg overflow-x-auto mb-3" {...props} />,
                                  blockquote: ({...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-300 my-3" {...props} />,
                                  a: ({...props}) => <a className="text-blue-400 hover:text-blue-300 underline" {...props} />,
                                  table: ({...props}) => <table className="min-w-full border border-gray-600 rounded mb-3" {...props} />,
                                  th: ({...props}) => <th className="border border-gray-600 px-3 py-2 bg-gray-800 text-left font-semibold" {...props} />,
                                  td: ({...props}) => <td className="border border-gray-600 px-3 py-2" {...props} />,
                                  hr: ({...props}) => <hr className="border-gray-600 my-4" {...props} />,
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          )}
                          <p className="text-xs opacity-60 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Loading indicator message */}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-2xl px-6 py-4 bg-gray-700/50 border border-gray-600/50 text-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <p className="text-sm text-gray-300">Bot is generating your response...</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-700/50 p-6">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask a question about the crawled data..."
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 placeholder-gray-500 transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                  >
                    {isLoading ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading chat...</p>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
