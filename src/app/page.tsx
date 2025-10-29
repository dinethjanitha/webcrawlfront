'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

interface HistoryItem {
  _id: string;
  keyword: string;
  siteDomain: string;
  urls: string[];
}

export default function Home() {
  const router = useRouter();
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [currentWebsiteUrl, setCurrentWebsiteUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [streamedText, setStreamedText] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [crawledUrls, setCrawledUrls] = useState<string[]>([]);
  const [urlsCount, setUrlsCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [urlError, setUrlError] = useState('');
  
  const DEFAULT_DOMAIN = 'com'; // Default domain for API calls

  // Fetch history on component mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/keyword/all');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const loadHistoryItem = async (id: string) => {
    // Redirect to chat page with the keyword ID
    router.push(`/chat?id=${encodeURIComponent(id)}`);
  };

  const showNotificationMessage = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const validateUrl = (url: string): boolean => {
    // Reset error
    setUrlError('');

    // Check if empty
    if (!url.trim()) {
      setUrlError('Please enter a website URL');
      return false;
    }

    // Add protocol if missing for validation
    let urlToValidate = url.trim();
    if (!urlToValidate.startsWith('http://') && !urlToValidate.startsWith('https://')) {
      urlToValidate = 'https://' + urlToValidate;
    }

    // Validate URL format
    try {
      const urlObj = new URL(urlToValidate);
      
      // Check if it has a valid hostname
      if (!urlObj.hostname || urlObj.hostname.length < 3) {
        setUrlError('Please enter a valid website URL');
        return false;
      }

      // Check if hostname has at least one dot (e.g., example.com)
      if (!urlObj.hostname.includes('.')) {
        setUrlError('Please enter a valid domain (e.g., example.com)');
        return false;
      }

      return true;
    } catch {
      setUrlError('Please enter a valid URL (e.g., example.com or https://example.com)');
      return false;
    }
  };

  const handleCrawl = async () => {
    if (!validateUrl(websiteUrl)) {
      showNotificationMessage(urlError);
      return;
    }

    setCurrentWebsiteUrl(websiteUrl);
    setHasSearched(true);
    setIsLoading(true);
    setResponse('');
    setStreamedText('');
    setCrawledUrls([]);
    setUrlsCount(0);

    try {
      // Call API with query parameters - using websiteUrl as keyword and default domain
      const res = await fetch(`/api/crawl?keyword=${encodeURIComponent(websiteUrl)}&domain=${encodeURIComponent(DEFAULT_DOMAIN)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch');
      }

      const data = await res.json();
      
      // Refresh history after successful crawl
      await fetchHistory();
      
      // Redirect to chat page with the keyword_id
      setIsLoading(false);
      if (data.keyword_id) {
        router.push(`/chat?id=${encodeURIComponent(data.keyword_id)}`);
      } else {
        setStreamedText('Crawl completed but no keyword ID returned.');
      }

    } catch (error) {
      setIsLoading(false);
      setStreamedText('Error: Failed to fetch crawl data. Please try again.');
      console.error('Crawl error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-red-500/90 backdrop-blur-lg border border-red-400/50 rounded-xl px-6 py-4 shadow-2xl flex items-center gap-3 min-w-[300px]">
            <svg className="w-6 h-6 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-white font-semibold text-sm">{notificationMessage}</p>
            </div>
            <button 
              onClick={() => setShowNotification(false)}
              className="ml-auto text-white hover:text-red-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-700/50 backdrop-blur-sm bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Web Crawler
          </h1>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 rounded-xl transition-all"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-300 text-sm font-medium">
              {showHistory ? 'Hide' : 'Show'} History
            </span>
          </button>
        </div>
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <div className="border-b border-gray-700/50 bg-gray-800/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
              <h2 className="text-lg font-semibold mb-4 text-gray-200 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Previous Searches
              </h2>
              {history.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No search history yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2">
                  {history.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => loadHistoryItem(item._id)}
                      disabled={loadingHistory}
                      className="bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-blue-500/50 rounded-lg p-4 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-blue-400 font-medium truncate group-hover:text-blue-300 transition-colors">
                            {item.keyword}
                          </p>
                          <p className="text-purple-400 text-sm truncate">
                            .{item.siteDomain}
                          </p>
                        </div>
                        <svg className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span>{item.urls.length} URLs</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Input Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
            <div className="space-y-2 mb-6">
              <label className="block text-sm font-medium text-gray-300">Website URL</label>
              <input
                type="text"
                value={websiteUrl}
                onChange={(e) => {
                  setWebsiteUrl(e.target.value);
                  setUrlError('');
                }}
                placeholder="Enter website URL (e.g., example.com or https://example.com)"
                className={`w-full px-4 py-3 bg-gray-900/50 border ${
                  urlError ? 'border-red-500' : 'border-gray-600/50'
                } rounded-xl focus:outline-none focus:ring-2 ${
                  urlError ? 'focus:ring-red-500' : 'focus:ring-blue-500'
                } focus:border-transparent text-gray-100 placeholder-gray-500 transition-all`}
                onKeyPress={(e) => e.key === 'Enter' && handleCrawl()}
              />
              {urlError && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {urlError}
                </p>
              )}
            </div>
            <button
              onClick={handleCrawl}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Crawling...
                </span>
              ) : (
                'Start Crawling'
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {hasSearched && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side - Current Search Info */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 shadow-xl sticky top-8">
                <h2 className="text-lg font-semibold mb-4 text-gray-200">Current Search</h2>
                <div className="space-y-4">
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                    <p className="text-xs text-gray-400 mb-1">Website URL</p>
                    <p className="text-blue-400 font-medium break-all">{currentWebsiteUrl}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                    <p className="text-xs text-gray-400 mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      {isLoading ? (
                        <>
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                          </span>
                          <span className="text-yellow-400 font-medium">Processing...</span>
                        </>
                      ) : streamedText || response ? (
                        <>
                          <span className="relative flex h-3 w-3">
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                          </span>
                          <span className="text-green-400 font-medium">Completed</span>
                        </>
                      ) : (
                        <>
                          <span className="relative flex h-3 w-3">
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-500"></span>
                          </span>
                          <span className="text-gray-400 font-medium">Waiting</span>
                        </>
                      )}
                    </div>
                  </div>
                  {urlsCount > 0 && (
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                      <p className="text-xs text-gray-400 mb-1">URLs Crawled</p>
                      <p className="text-cyan-400 font-medium text-lg">{urlsCount}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Results */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary Section */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-xl min-h-[500px]">
                <h2 className="text-lg font-semibold mb-6 text-gray-200 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Analysis Results
                </h2>
                <div className="max-h-[600px] overflow-y-auto pr-2">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                        <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                      </div>
                      <p className="text-gray-400 mt-6 animate-pulse">Crawling and analyzing web pages...</p>
                    </div>
                  ) : streamedText || response ? (
                    <div className="prose prose-invert prose-headings:text-white prose-strong:text-white prose-strong:font-bold prose-em:text-gray-300 prose-ul:text-gray-200 prose-ol:text-gray-200 prose-li:text-gray-200 max-w-none">
                      <ReactMarkdown
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mb-4 mt-6" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-xl font-bold text-white mb-3 mt-5" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-white mb-2 mt-4" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                          em: ({node, ...props}) => <em className="italic text-gray-300" {...props} />,
                          p: ({node, ...props}) => <p className="text-gray-200 mb-4 leading-relaxed" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-1 text-gray-200" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-200" {...props} />,
                          li: ({node, ...props}) => <li className="text-gray-200 ml-4" {...props} />,
                          code: ({node, ...props}) => <code className="bg-gray-700/50 px-2 py-1 rounded text-blue-300 text-sm" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-300 my-4" {...props} />,
                        }}
                      >
                        {streamedText || response}
                      </ReactMarkdown>
                      {streamedText && !response && (
                        <span className="inline-block w-1 h-5 bg-blue-500 ml-1 animate-pulse"></span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center">
                        <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-gray-400">Waiting for results...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Crawled URLs Section */}
              {crawledUrls.length > 0 && (
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-xl">
                  <h2 className="text-lg font-semibold mb-6 text-gray-200 flex items-center gap-2">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Crawled URLs ({crawledUrls.length})
                  </h2>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {crawledUrls.map((url, index) => (
                      <div key={index} className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/30 hover:border-cyan-500/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <span className="text-cyan-400 font-mono text-sm mt-0.5">{index + 1}.</span>
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm break-all underline-offset-2 hover:underline flex-1"
                          >
                            {url}
                          </a>
                          <svg className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Initial State */}
        {!hasSearched && (
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-12">
              <svg className="w-20 h-20 text-gray-600 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">Ready to Crawl</h3>
              <p className="text-gray-500">Enter a keyword and domain above to start crawling and analyzing web pages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
