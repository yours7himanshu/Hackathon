"use client";

import React, { useState, useEffect } from 'react';

// Types for our news data
interface Article {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
  content: string;
}

interface NewsResponse {
  status: string;
  totalResults: number;
  articles: Article[];
}

const NEWS_API_KEY = '8512c9d5e506433d9e690fbefb876f50'; // Replace with your actual NewsAPI key

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const fetchNews = async (query: string = '') => {
    setLoading(true);
    try {
      // Base URL for health news
      let url = `https://newsapi.org/v2/top-headlines?category=health&apiKey=${NEWS_API_KEY}&pageSize=20`;
      
      // Add search query if provided
      if (query) {
        url = `https://newsapi.org/v2/everything?q=${query}+medical+health&apiKey=${NEWS_API_KEY}&pageSize=20`;
      }
      
      const response = await fetch(url);
      const data: NewsResponse = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error(data.status);
      }
      
      setArticles(data.articles);
    } catch (err) {
      setError('Failed to fetch news. Please try again later.');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNews(searchQuery);
  };
  
  useEffect(() => {
    fetchNews();
  }, []);
  
  return React.createElement('div', { className: "news-container" },
    React.createElement('header', { className: "news-header" },
      React.createElement('h1', null, 'Latest Medical News'),
      React.createElement('p', null, 'Stay updated with the latest developments in medicine and healthcare'),
      React.createElement('form', { onSubmit: handleSearch, className: "search-form" },
        React.createElement('input', {
          type: "text",
          placeholder: "Search for medical news...",
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          className: "search-input"
        }),
        React.createElement('button', { type: "submit", className: "search-button" }, "Search")
      )
    ),
    
    loading && React.createElement('div', { className: "loading-container" },
      React.createElement('div', { className: "loader" }),
      React.createElement('p', null, 'Loading latest medical news...')
    ),
    
    error && React.createElement('div', { className: "error-container" },
      React.createElement('p', null, error)
    ),
    
    React.createElement('div', { className: "news-grid" },
      articles.map((article, index) => 
        React.createElement('div', { className: "news-card", key: `${article.title}-${index}` },
          React.createElement('div', { className: "news-image-container" },
            article.urlToImage ? 
              React.createElement('img', { src: article.urlToImage, alt: article.title, className: "news-image" }) :
              React.createElement('div', { className: "news-image-placeholder" },
                React.createElement('span', null, "Medical News")
              ),
            React.createElement('div', { className: "news-source" }, article.source.name)
          ),
          React.createElement('div', { className: "news-content" },
            React.createElement('h3', { className: "news-title" }, article.title),
            React.createElement('p', { className: "news-description" }, article.description || 'No description available'),
            React.createElement('div', { className: "news-footer" },
              React.createElement('span', { className: "news-date" },
                new Date(article.publishedAt).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })
              ),
              React.createElement('a', { href: article.url, target: "_blank", rel: "noopener noreferrer", className: "read-more" }, "Read More")
            )
          )
        )
      ),
      articles.length === 0 && !loading && !error &&
        React.createElement('div', { className: "no-results" }, "No news articles found. Try a different search.")
    )
  );
}
