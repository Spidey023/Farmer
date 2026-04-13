import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import getLocation from "../../utils/getLocation";
import TodayTaskComponent from "./TodayTaskComponent";
import type { Crop } from "../../types/type";
import Card from "../../ui/Card";
import Badge from "../../ui/Badge";

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
        // Don’t throw here — throwing inside a component effect will crash the whole route
        // and show a white page. Instead, show a friendly message.
        setError(
          "Unable to fetch weather (location permission blocked or server error)."
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
          <Card className="h-full">
            <h2 className="font-semibold mb-2 text-gray-900">
              Today&apos;s Weather
            </h2>
            <p className="text-sm text-gray-500">
              Location: {weather?.city ?? "—"}
            </p>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-bold">{weather?.temp ?? "—"}</span>
              <span className="text-sm text-gray-500">
                {weather?.description ?? "—"}
              </span>
            </div>

            <p className="text-sm text-gray-500 mt-2">
              Humidity{" "}
              <span className="font-medium">{weather?.humidity ?? "—"}</span>
            </p>
          </Card>

          {/* TODAY'S TASKS */}
          <TodayTaskComponent crops={crops} />

          <Card className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Your Crops</h2>
              <button className="text-xs text-blue-600 hover:underline">
                View all
              </button>
            </div>

            <ul className="text-sm text-gray-700 space-y-3">
              {crops && crops.length > 0 ? (
                crops.map((crop) => (
                  <li
                    key={crop.cropId}
                    className="flex items-center justify-between"
                  >
                    <span>{crop.name}</span>
                    <Badge>Healthy</Badge>
                  </li>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No crops found</p>
              )}
            </ul>
          </Card>
        </div>
      )}
    </>
  );
};

export default WeatherComponent;
