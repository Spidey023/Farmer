import { createContext, useEffect, useState } from "react";
import type { DashboardResponse, DashboardData } from "../../types/type";
import { api } from "../../lib/api";

type FarmerContextValue = {
  farmerData: DashboardData | null;
  error: string | null;
};

// eslint-disable-next-line react-refresh/only-export-components
export const FarmerContext = createContext<FarmerContextValue | null>(null);

const FarmerContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [farmerData, setFarmerData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopStats = async () => {
      try {
        const response = await api.get<DashboardResponse>("/auth/dashboard");
        setFarmerData(response.data.data);
        console.log("Top Stats Data:", response.data);
      } catch (err) {
        console.error("Error fetching top stats data:", err);
        setError("Failed to fetch top stats data");
      }
    };

    fetchTopStats();
  }, []);

  return (
    <FarmerContext.Provider value={{ farmerData, error }}>
      {children}
    </FarmerContext.Provider>
  );
};

export default FarmerContextProvider;
