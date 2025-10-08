import React, { useState } from "react";
import Navbar from "../components/Navbar";

function ScenarioManagement() {
  const [maps, setMaps] = useState([]); // 업로드된 대피도 이미지
  const [currentFloor, setCurrentFloor] = useState(0);
  const [icons, setIcons] = useState({}); // {층번호: [{x,y,type}]}
  const [selectedTool, setSelectedTool] = useState(null);

  // 파일 업로드
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newMaps = files.map((file) => URL.createObjectURL(file));
    setMaps([...maps, ...newMaps]);
  };

  // 대피도 클릭 → 아이콘 추가
  const handleMapClick = (e) => {
    if (!selectedTool) return;

    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newIcon = { x, y, type: selectedTool };

    setIcons({
      ...icons,
      [currentFloor]: [...(icons[currentFloor] || []), newIcon],
    });
  };

  // 아이콘 삭제
  const handleRemoveIcon = (floor, index) => {
    const newFloorIcons = [...icons[floor]];
    newFloorIcons.splice(index, 1);
    setIcons({ ...icons, [floor]: newFloorIcons });
  };

  // 저장 버튼 (예: 콘솔 출력)
  const handleSave = () => {
    console.log("저장된 데이터:", icons);
    alert("변경 사항이 저장되었습니다!");
  };

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <div className="p-8">
        <h2 className="text-3xl font-bold text-[#2E7D32] mb-4">
          시나리오 관리
        </h2>

        {/* 파일 업로드 */}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className="mb-4"
        />

        {/* 층 선택 */}
        {maps.length > 0 && (
          <div className="flex space-x-3 mb-6 overflow-x-auto">
            {maps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentFloor(idx)}
                className={`px-4 py-2 rounded ${
                  currentFloor === idx
                    ? "bg-[#66BB6A] text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {idx + 1}층
              </button>
            ))}
          </div>
        )}

        {/* 대피도 + 아이콘 표시 */}
        {maps.length > 0 && (
          <div
            className="relative border rounded-lg shadow-lg w-full max-w-4xl h-[500px] overflow-hidden"
            onClick={handleMapClick}
          >
            <img
              src={maps[currentFloor]}
              alt={`Floor ${currentFloor + 1}`}
              className="w-full h-full object-contain"
            />
            {(icons[currentFloor] || []).map((icon, i) => (
              <div
                key={i}
                className="absolute cursor-pointer"
                style={{ top: `${icon.y}px`, left: `${icon.x}px` }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (icon.type.includes("exit")) {
                    handleRemoveIcon(currentFloor, i);
                  }
                }}
              >
                {/* 아이콘 표시 */}
                {icon.type === "emergencyExit" && (
                  <span className="text-green-600 text-2xl">🚨</span>
                )}
                {icon.type === "normalExit" && (
                  <span className="text-blue-600 text-2xl">🚪</span>
                )}
                {icon.type === "fireExtinguisher" && (
                  <span className="text-red-600 text-2xl">🧯</span>
                )}
                {icon.type === "alarm" && (
                  <span className="text-red-500 text-2xl">🔔</span>
                )}
                {icon.type === "sprinkler" && (
                  <span className="text-blue-400 text-2xl">💧</span>
                )}
                {icon.type === "hydrant" && (
                  <span className="text-red-700 text-2xl">🚒</span>
                )}
                {icon.type === "meeting" && (
                  <span className="text-yellow-600 text-2xl">👥</span>
                )}
                {icon.type === "danger" && (
                  <span className="text-black text-2xl">⚠️</span>
                )}
                {icon.type === "exclude" && (
                  <span className="text-gray-600 text-2xl">❌</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 버튼 그룹 */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {/* 출구 관리 */}
          <div>
            <h3 className="font-bold text-[#2E7D32] mb-2">출구 관리</h3>
            <button
              onClick={() => setSelectedTool("emergencyExit")}
              className="block w-full px-4 py-2 bg-[#66BB6A] text-white rounded mb-2"
            >
              비상구 추가🚨
            </button>
            <button
              onClick={() => setSelectedTool("normalExit")}
              className="block w-full px-4 py-2 bg-[#81C784] text-white rounded mb-2"
            >
              일반 출구 추가🚪
            </button>
            <button
              onClick={() => setSelectedTool("delete")}
              className="block w-full px-4 py-2 bg-red-500 text-white rounded"
            >
              출구 삭제
            </button>
          </div>

          {/* 안전 장치 */}
          <div>
            <h3 className="font-bold text-[#2E7D32] mb-2">안전 장치</h3>
            <button
              onClick={() => setSelectedTool("fireExtinguisher")}
              className="block w-full px-4 py-2 bg-red-500 text-white rounded mb-2"
            >
              소화기 배치🧯
            </button>
            <button
              onClick={() => setSelectedTool("alarm")}
              className="block w-full px-4 py-2 bg-yellow-500 text-white rounded mb-2"
            >
              화재 경보기 추가🔔
            </button>
            <button
              onClick={() => setSelectedTool("sprinkler")}
              className="block w-full px-4 py-2 bg-blue-400 text-white rounded mb-2"
            >
              스프링클러 추가💧
            </button>
            <button
              onClick={() => setSelectedTool("hydrant")}
              className="block w-full px-4 py-2 bg-red-700 text-white rounded"
            >
              소화전 배치🚒
            </button>
          </div>

          {/* 기타 설정 */}
          <div>
            <h3 className="font-bold text-[#2E7D32] mb-2">기타 설정</h3>
            <button
              onClick={() => setSelectedTool("meeting")}
              className="block w-full px-4 py-2 bg-[#FBC02D] text-white rounded mb-2"
            >
              집합 장소 지정👥
            </button>
            <button
              onClick={() => setSelectedTool("danger")}
              className="block w-full px-4 py-2 bg-black text-white rounded mb-2"
            >
              위험 구역 지정⚠️
            </button>
            <button
              onClick={() => setSelectedTool("exclude")}
              className="block w-full px-4 py-2 bg-gray-600 text-white rounded"
            >
              제외 구역 지정❌
            </button>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="mt-6">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-[#2E7D32] text-white font-bold rounded-lg shadow"
          >
            변경 사항 저장
          </button>
        </div>
      </div>
    </div>
  );
}

export default ScenarioManagement;
