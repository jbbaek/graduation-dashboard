import React from "react";
import { useNavigate } from "react-router-dom";

function Main() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 space-y-4">
      <button
        onClick={() => navigate("/create-channel")}
        className="w-64 bg-[#FBC02D] hover:bg-yellow-500 text-white font-bold py-2 rounded-lg shadow"
      >
        채널 생성하기
      </button>
      <button
        onClick={() => navigate("/join-channel")}
        className="w-64 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg shadow"
      >
        채널 들어가기
      </button>
    </div>
  );
}

export default Main;
