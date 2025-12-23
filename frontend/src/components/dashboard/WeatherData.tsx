import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import getLocation from "../../utils/getLocation";
import TodayTaskComponent from "./TodayTaskComponent";
import type { Crop } from "../../types/type";

type WeatherData = {
  city: string;
  temp: number;
  feels_like: number;
  humidity: number;
  description: string;
  icon: string;
};

const WeatherComponent = ({ crops }: { crops: Crop[] }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch weather data from backend API
    const fetchWeather = async () => {
      try {
        const pos = await getLocation();
        const { latitude, longitude } = pos.coords;
        console.log(latitude, longitude);

        const response = await api.post("/auth/weather", {
          params: { lat: latitude, lon: longitude },
        });
        console.log(response.data);

        setWeather(response.data);
      } catch (error) {
        setError("Failed to fetch weather data");
        throw new Error(
          "Error fetching weather data",
          error instanceof Error ? { cause: error } : undefined
        );
      }
    };
    fetchWeather();
  }, []);

  console.log(weather?.city);

  return (
    <>
      {error ? (
        <p>{error}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* WEATHER */}
          <div className="bg-white shadow rounded-lg p-4 lg:col-span-1">
            <h2 className="font-semibold mb-2">Today&apos;s Weather</h2>
            <p className="text-sm text-gray-500">Location: {weather?.city}</p>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-bold">{weather?.temp}</span>
              <span className="text-sm text-gray-500">
                {weather?.description}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Humidity <span className="font-medium">{weather?.humidity}</span>
            </p>
          </div>
          {/* TODAY'S TASKS */}
          <TodayTaskComponent crops={crops} />

          <div className="bg-white shadow rounded-lg p-4 lg:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Your Crops</h2>
              <button className="text-xs text-blue-600 hover:underline">
                View all fields from
              </button>
            </div>
            <ul className="text-sm text-gray-700 space-y-2">
              {crops.map((crop) => (
                <li key={crop.cropId} className="flex justify-between">
                  <span>Crop Name: {crop.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                    Healthy
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default WeatherComponent;
