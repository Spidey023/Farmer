import { createContext, useEffect, useState } from "react";
import type {
  FarmerDashboard,
  FarmerDashboardResponse,
} from "../../components/dashboard/types/DashBaordTypes";
import { api } from "../../lib/api";

type FarmerContextValue = {
  farmerData: FarmerDashboard | null;
  error: string | null;
};

// eslint-disable-next-line react-refresh/only-export-components
export const FarmerContext = createContext<FarmerContextValue | null>(null);

const FarmerContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [farmerData, setFarmerData] = useState<FarmerDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopStats = async () => {
      try {
        const response = await api.get<FarmerDashboardResponse>(
          "/auth/dashboard"
        );
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
