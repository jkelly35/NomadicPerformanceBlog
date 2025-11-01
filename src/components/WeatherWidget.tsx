'use client';

import React, { useState, useEffect } from 'react';
import { getWeatherForActivity } from '@/lib/weather-api';

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  isGoodForOutdoorActivity: boolean;
}

interface WeatherWidgetProps {
  lat?: number;
  lon?: number;
  showRecommendations?: boolean;
  compact?: boolean;
}

export default function WeatherWidget({
  lat,
  lon,
  showRecommendations = true,
  compact = false
}: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Get user's location if not provided
  useEffect(() => {
    if (lat && lon) {
      setLocation({ lat, lon });
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          setError('Unable to get location. Please enable location services.');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  }, [lat, lon]);

  // Fetch weather data when location is available
  useEffect(() => {
    if (location && !weather && !loading) {
      fetchWeather();
    }
  }, [location]);

  const fetchWeather = async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      const weatherData = await getWeatherForActivity(location.lat, location.lon);
      setWeather(weatherData);

      // Check if we're in demo mode (no API key configured)
      const hasApiKey = !!process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
      setIsDemoMode(!hasApiKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch weather data. Please try again later.');
      console.error('Weather API error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get user's location if not provided
  useEffect(() => {
    if (lat && lon) {
      setLocation({ lat, lon });
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          setError('Unable to get location. Please enable location services.');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  }, [lat, lon]);

  // Fetch weather data when location is available
  useEffect(() => {
    if (location && !weather && !loading) {
      fetchWeather();
    }
  }, [location]);

  const getWeatherIcon = (condition: string) => {
    const iconMap: Record<string, string> = {
      'clear': '☀️',
      'clouds': '☁️',
      'rain': '🌧️',
      'snow': '❄️',
      'thunderstorm': '⛈️',
      'drizzle': '🌦️',
      'mist': '🌫️'
    };
    return iconMap[condition.toLowerCase()] || '🌤️';
  };

  const getActivityRecommendation = (weather: WeatherData) => {
    if (weather.temperature < 32) {
      return {
        type: 'warning',
        message: 'Freezing temperatures! Consider indoor activities or dress warmly.',
        suggestion: 'Try indoor strength training or yoga.'
      };
    }

    if (weather.temperature > 90) {
      return {
        type: 'warning',
        message: 'Extreme heat! Stay hydrated and avoid intense outdoor activities.',
        suggestion: 'Consider early morning workouts or indoor alternatives.'
      };
    }

    if (weather.condition.toLowerCase().includes('rain') || weather.condition.toLowerCase().includes('snow')) {
      return {
        type: 'caution',
        message: 'Precipitation expected. Plan accordingly.',
        suggestion: 'Indoor cardio, weight training, or reschedule outdoor activities.'
      };
    }

    if (weather.windSpeed > 20) {
      return {
        type: 'caution',
        message: 'Strong winds may affect outdoor activities.',
        suggestion: 'Consider indoor alternatives or sheltered outdoor activities.'
      };
    }

    if (weather.uvIndex > 7) {
      return {
        type: 'warning',
        message: 'High UV index! Protect your skin.',
        suggestion: 'Apply sunscreen and consider shaded activities.'
      };
    }

    if (weather.isGoodForOutdoorActivity) {
      return {
        type: 'good',
        message: 'Perfect weather for outdoor activities!',
        suggestion: 'Great conditions for hiking, running, or cycling.'
      };
    }

    return {
      type: 'neutral',
      message: 'Weather conditions are moderate.',
      suggestion: 'Good for most activities with appropriate preparation.'
    };
  };

  if (compact && weather) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <span className="text-lg">{getWeatherIcon(weather.condition)}</span>
        <span>{Math.round(weather.temperature)}°F</span>
        <span className="text-gray-500">{weather.condition}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <span className="mr-2">🌤️</span>
          Weather Conditions
        </h3>
        {location && (
          <button
            onClick={fetchWeather}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Refresh'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
          <p className="text-red-700 text-sm font-medium mb-2">Weather Service Unavailable</p>
          <p className="text-red-600 text-sm">
            {error.includes('API key not configured') ? (
              <>
                To enable weather features, please:
                <br />• Get a free API key from{' '}
                <a
                  href="https://openweathermap.org/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-red-800"
                >
                  OpenWeatherMap
                </a>
                <br />• Add it to your environment variables as <code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_OPENWEATHER_API_KEY</code>
              </>
            ) : error.includes('Invalid API key') ? (
              'Please check your OpenWeatherMap API key configuration.'
            ) : error.includes('rate limit') ? (
              'Weather service is temporarily busy. Please try again in a few minutes.'
            ) : (
              'Weather information is currently unavailable. Please try again later.'
            )}
          </p>
        </div>
      )}

      {loading && (
        <div className="animate-pulse space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      )}

      {weather && !loading && (
        <div className="space-y-4">
          {/* Current Weather */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-4xl">{getWeatherIcon(weather.condition)}</span>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {Math.round(weather.temperature)}°F
                </div>
                <div className="text-gray-600 capitalize">{weather.condition}</div>
                {isDemoMode && (
                  <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded mt-1">
                    Demo Mode - Add API key for live data
                  </div>
                )}
              </div>
            </div>
            <div className="text-right text-sm text-gray-600">
              <div>Humidity: {weather.humidity}%</div>
              <div>Wind: {Math.round(weather.windSpeed)} mph</div>
              {weather.uvIndex > 0 && <div>UV Index: {weather.uvIndex}</div>}
            </div>
          </div>

          {/* Activity Recommendations */}
          {showRecommendations && (
            <div className="border-t pt-3">
              {(() => {
                const recommendation = getActivityRecommendation(weather);
                const bgColor = {
                  good: 'bg-green-50 border-green-200',
                  warning: 'bg-yellow-50 border-yellow-200',
                  caution: 'bg-blue-50 border-blue-200',
                  neutral: 'bg-gray-50 border-gray-200'
                }[recommendation.type];

                const textColor = {
                  good: 'text-green-800',
                  warning: 'text-yellow-800',
                  caution: 'text-blue-800',
                  neutral: 'text-gray-800'
                }[recommendation.type];

                return (
                  <div className={`border rounded-md p-3 ${bgColor}`}>
                    <h4 className={`font-medium ${textColor} mb-1`}>
                      {recommendation.type === 'good' && '✅'}
                      {recommendation.type === 'warning' && '⚠️'}
                      {recommendation.type === 'caution' && 'ℹ️'}
                      {recommendation.type === 'neutral' && '📋'}
                      {' '}{recommendation.message}
                    </h4>
                    <p className={`text-sm ${textColor} opacity-90`}>
                      {recommendation.suggestion}
                    </p>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {!location && !error && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Getting your location...</p>
        </div>
      )}
    </div>
  );
}
