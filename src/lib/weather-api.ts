// src/lib/weather-api.ts
interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  isGoodForOutdoorActivity: boolean;
}

// Demo/mock weather data for when API is not configured
const DEMO_WEATHER_DATA: WeatherData = {
  temperature: 72,
  condition: 'Clear',
  humidity: 45,
  windSpeed: 8,
  uvIndex: 6,
  isGoodForOutdoorActivity: true
};

export async function getWeatherForActivity(lat: number, lon: number): Promise<WeatherData> {
  const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  // If no API key is configured, return demo data
  if (!API_KEY) {
    console.warn('OpenWeatherMap API key not configured. Using demo weather data.');
    return {
      ...DEMO_WEATHER_DATA,
      temperature: DEMO_WEATHER_DATA.temperature + Math.floor(Math.random() * 20) - 10, // Add some variation
    };
  }

  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid OpenWeatherMap API key. Please check your API key configuration.');
    } else if (response.status === 429) {
      throw new Error('OpenWeatherMap API rate limit exceeded. Please try again later.');
    } else {
      throw new Error(`Weather service temporarily unavailable (${response.status}). Please try again later.`);
    }
  }

  const data = await response.json();

  return {
    temperature: Math.round(data.main.temp),
    condition: data.weather[0].main,
    humidity: data.main.humidity || 50, // Default to 50% if not available
    windSpeed: Math.round(data.wind?.speed || 0),
    uvIndex: Math.round(data.uvi || 0),
    isGoodForOutdoorActivity: isGoodWeatherForActivity(data)
  };
}

function isGoodWeatherForActivity(weatherData: any): boolean {
  const temp = weatherData.main.temp;
  const condition = weatherData.weather[0].main.toLowerCase();
  const windSpeed = weatherData.wind?.speed || 0;

  // Good conditions: 40-85°F, no severe weather, wind < 20 mph
  return temp >= 40 && temp <= 85 &&
         !['thunderstorm', 'snow', 'rain'].includes(condition) &&
         windSpeed < 20;
}
