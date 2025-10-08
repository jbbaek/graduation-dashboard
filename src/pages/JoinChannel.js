import React, { useState } from "react";

function JoinChannel() {
  const [code, setCode] = useState("");

  const handleJoin = () => {
    console.log("입력 코드:", code);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="bg-white border border-green-300 rounded-lg p-8 shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">
          코드 입력
        </h2>
        <p className="text-center text-gray-600 mb-6">학교 코드를 입력하세요</p>
        <input
          type="text"
          placeholder="학교 코드"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 mb-6"
        />
        <button
          onClick={handleJoin}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow"
        >
          입장하기
        </button>
      </div>
    </div>
  );
}

export default JoinChannel;
