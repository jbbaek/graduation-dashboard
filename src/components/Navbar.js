import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // 현재 경로와 버튼 경로가 같으면 active 상태
  const navItems = [
    { path: "/school-channel", label: "메인화면" },
    { path: "/school-setting", label: "학교 환경 설정" },
    { path: "/scenario", label: "시나리오 관리" },
    { path: "/monitoring", label: "실시간 모니터링" },
    { path: "/analysis", label: "분석 결과" },
  ];

  return (
    <nav className="flex space-x-3 p-4">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`px-4 py-2 rounded-full border border-green-600 font-semibold transition
              ${
                isActive
                  ? "bg-green-600 text-white"
                  : "bg-white text-black hover:bg-green-600 hover:text-white"
              }`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

export default Navbar;
