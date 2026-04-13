// import { createContext, useCallback, useEffect, useState } from "react";
// import type { DashboardResponse, DashboardData } from "../../types/type";
// import { api } from "../../lib/api";

// type FarmerContextValue = {
//   farmerData: DashboardData | null;
//   error: string | null;
//   isLoading: boolean;
//   refreshFarmer: () => Promise<void>;
//   clearFarmer: () => void;
// };

// // eslint-disable-next-line react-refresh/only-export-components
// export const FarmerContext = createContext<FarmerContextValue | null>(null);

// const FarmerContextProvider = ({ children }: { children: React.ReactNode }) => {
//   const [farmerData, setFarmerData] = useState<DashboardData | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   const clearFarmer = useCallback(() => {
//     setFarmerData(null);
//     setError(null);
//   }, []);

//   const refreshFarmer = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       setError(null);

//       // ✅ MUST return data for currently logged-in user
//       const response = await api.get<DashboardResponse>("/auth/dashboard");

//       setFarmerData(response.data.data);
//       console.log("Dashboard Data:", response.data.data);
//     } catch (err) {
//       console.error("Error fetching dashboard data:", err);
//       setError("Failed to fetch dashboard data");
//       setFarmerData(null);
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     refreshFarmer();
//   }, [refreshFarmer]);

//   return (
//     <FarmerContext.Provider
//       value={{ farmerData, error, isLoading, refreshFarmer, clearFarmer }}
//     >
//       {children}
//     </FarmerContext.Provider>
//   );
// };

// export default FarmerContextProvider;
