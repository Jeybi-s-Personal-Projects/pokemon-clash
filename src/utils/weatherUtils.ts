import { WeatherCondition } from "../battle/battleTypes";

export type WeatherEffect = {
  weather: WeatherCondition;
  duration: number;
};

/**
 * Mapping of move names to their weather effects.
 */
export const MOVE_WEATHER_MAP: Record<string, WeatherEffect> = {
  "rain-dance": { weather: "rain", duration: 5 },
  "sunny-day": { weather: "sun", duration: 5 },
  "sandstorm": { weather: "sandstorm", duration: 5 },
  "hail": { weather: "hail", duration: 5 },
};

/**
 * Gets the message to display when a specific weather starts.
 */
export const getWeatherStartMessage = (weather: WeatherCondition): string => {
  switch (weather) {
    case "rain": return "It started to rain!";
    case "sun": return "The sunlight turned harsh!";
    case "sandstorm": return "A sandstorm is brewing!";
    case "hail": return "It started to hail!";
    default: return "";
  }
};

/**
 * Gets the message to display when a specific weather continues.
 */
export const getWeatherContinueMessage = (weather: WeatherCondition): string => {
  switch (weather) {
    case "rain": return "Rain continues to fall.";
    case "sun": return "The sunlight is strong.";
    case "sandstorm": return "The sandstorm rages.";
    case "hail": return "The hail crashes down.";
    default: return "";
  }
};
