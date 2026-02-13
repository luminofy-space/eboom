"use client";

import { useRouter } from "next/navigation";
const DashboardPage = () => {
    const router = useRouter();
  return <div>
    <button onClick={() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        router.push("/login");
    }}>
        Logout
    </button>   
  </div>;
};

export default DashboardPage;