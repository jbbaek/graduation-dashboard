import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-white-600">
      <img
        src="/img/image.png"
        alt="로고"
        className="w-100 h-50 animate-pulse"
      />
    </div>
  );
}

export default SplashScreen;
