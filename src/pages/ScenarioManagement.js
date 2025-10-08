import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

function ScenarioManagement() {
  // 발생 설정 상태
  const [fireSetting, setFireSetting] = useState("자동설정");
  const [fireLocation, setFireLocation] = useState("");
  const [fireIntensity, setFireIntensity] = useState("");
  const [trainingTime, setTrainingTime] = useState("");

  // 팀 설정 상태
  const [teamSetting, setTeamSetting] = useState("자동설정");
  const [teamType, setTeamType] = useState("");

  // NPC 설정 상태
  const [npcSetting, setNpcSetting] = useState("자동설정");
  const [npcPosition, setNpcPosition] = useState("");
  const [npcStatus, setNpcStatus] = useState("");

  // 참여자 설정
  const [participants, setParticipants] = useState("");

  // 드롭다운 옵션
  const fireLocations = ["1층", "2층", "3층", "4층"];
  const fireIntensities = ["약", "보통", "강"];
  const trainingTimes = ["5분", "10분", "15분", "30분"];
  const teamTypes = ["진화팀", "대피팀", "구조팀"];
  const npcPositions = ["입구", "복도", "계단", "출구"];
  const npcStatuses = ["정상", "이상", "대기"];

  // 자동 설정 lock 여부 체크
  const isAllAuto =
    fireSetting === "자동설정" &&
    teamSetting === "자동설정" &&
    npcSetting === "자동설정";

  // lock 걸릴 때 초기화 처리
  useEffect(() => {
    if (isAllAuto) {
      setFireLocation("");
      setFireIntensity("");
      setTrainingTime("");
      setTeamType("");
      setNpcPosition("");
      setNpcStatus("");
    }
  }, [isAllAuto]);

  return (
    <div className="bg-[#F9FBE7] min-h-screen">
      <Navbar />
      <div className="p-8 space-y-6">
        <h2 className="text-3xl font-bold text-[#2E7D32] mb-4">
          시나리오 관리
        </h2>

        {/* 발생 설정 */}
        <div className="p-4 bg-white rounded shadow space-y-4">
          <h3 className="text-xl font-semibold text-[#2E7D32]">발생 설정</h3>
          <select
            value={fireSetting}
            onChange={(e) => setFireSetting(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          >
            <option value="자동설정">자동설정</option>
            <option value="수동설정">수동설정</option>
          </select>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block mb-1">화재 발생 위치</label>
              <select
                value={fireLocation}
                onChange={(e) => setFireLocation(e.target.value)}
                disabled={fireSetting === "자동설정" || isAllAuto}
                className={`border px-3 py-2 rounded w-full ${
                  fireSetting === "자동설정" || isAllAuto
                    ? "bg-gray-100 opacity-50"
                    : ""
                }`}
              >
                <option value="">선택</option>
                {fireLocations.map((loc, i) => (
                  <option key={i} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1">화재 강도</label>
              <select
                value={fireIntensity}
                onChange={(e) => setFireIntensity(e.target.value)}
                disabled={fireSetting === "자동설정" || isAllAuto}
                className={`border px-3 py-2 rounded w-full ${
                  fireSetting === "자동설정" || isAllAuto
                    ? "bg-gray-100 opacity-50"
                    : ""
                }`}
              >
                <option value="">선택</option>
                {fireIntensities.map((level, i) => (
                  <option key={i} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1">훈련 시간</label>
              <select
                value={trainingTime}
                onChange={(e) => setTrainingTime(e.target.value)}
                disabled={fireSetting === "자동설정" || isAllAuto}
                className={`border px-3 py-2 rounded w-full ${
                  fireSetting === "자동설정" || isAllAuto
                    ? "bg-gray-100 opacity-50"
                    : ""
                }`}
              >
                <option value="">선택</option>
                {trainingTimes.map((time, i) => (
                  <option key={i} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 팀 설정 */}
        <div className="p-4 bg-white rounded shadow space-y-4">
          <h3 className="text-xl font-semibold text-[#2E7D32]">팀 설정</h3>
          <select
            value={teamSetting}
            onChange={(e) => setTeamSetting(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          >
            <option value="자동설정">자동설정</option>
            <option value="수동설정">수동설정</option>
          </select>

          <div className="flex space-x-2">
            {teamTypes.map((team, i) => (
              <button
                key={i}
                onClick={() => setTeamType(team)}
                disabled={teamSetting === "자동설정" || isAllAuto}
                className={`px-4 py-2 rounded ${
                  teamType === team
                    ? "bg-[#66BB6A] text-white"
                    : "bg-gray-200 text-gray-800"
                } ${
                  teamSetting === "자동설정" || isAllAuto ? "opacity-50" : ""
                }`}
              >
                {team}
              </button>
            ))}
          </div>
        </div>

        {/* NPC 설정 */}
        <div className="p-4 bg-white rounded shadow space-y-4">
          <h3 className="text-xl font-semibold text-[#2E7D32]">NPC 설정</h3>
          <select
            value={npcSetting}
            onChange={(e) => setNpcSetting(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          >
            <option value="자동설정">자동설정</option>
            <option value="수동설정">수동설정</option>
          </select>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">위치</label>
              <select
                value={npcPosition}
                onChange={(e) => setNpcPosition(e.target.value)}
                disabled={npcSetting === "자동설정" || isAllAuto}
                className={`border px-3 py-2 rounded w-full ${
                  npcSetting === "자동설정" || isAllAuto
                    ? "bg-gray-100 opacity-50"
                    : ""
                }`}
              >
                <option value="">선택</option>
                {npcPositions.map((pos, i) => (
                  <option key={i} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1">상태</label>
              <select
                value={npcStatus}
                onChange={(e) => setNpcStatus(e.target.value)}
                disabled={npcSetting === "자동설정" || isAllAuto}
                className={`border px-3 py-2 rounded w-full ${
                  npcSetting === "자동설정" || isAllAuto
                    ? "bg-gray-100 opacity-50"
                    : ""
                }`}
              >
                <option value="">선택</option>
                {npcStatuses.map((status, i) => (
                  <option key={i} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 참여자 설정 */}
        <div className="p-4 bg-white rounded shadow space-y-2">
          <h3 className="text-xl font-semibold text-[#2E7D32]">참여자 설정</h3>
          <input
            type="text"
            placeholder="참여 인원 입력"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        {/* 저장 버튼 */}
        <div className="mt-4">
          <button className="px-6 py-3 bg-[#2E7D32] text-white rounded-lg shadow">
            시나리오 저장
          </button>
        </div>
      </div>
    </div>
  );
}

export default ScenarioManagement;
