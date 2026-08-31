import { useEffect, useState } from "react";
import Spinner from "../components/ui/Spinner";
import EmployeeDashboard from "../components/EmployeeDashboard";
import AdminDashboard from "../components/AdminDashboard";
import api from "../api/axios";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data || error)
    return (
      <div className="text-center py-20 text-ink-500">
        We couldn't load your dashboard. Please try again later.
      </div>
    );

  if (data.role === "ADMIN") {
    return <AdminDashboard data={data} />;
  }
  return <EmployeeDashboard data={data} />;
};

export default Dashboard;
