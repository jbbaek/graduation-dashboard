import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";

const API_BASE = "http://localhost:8000";

// 재난 유형별 팀 구성 매핑
const TEAM_TYPES_BY_DISASTER = {
  지진: ["시민팀", "팀1", "팀2"],
  화재: ["진화팀", "대피팀", "구조팀"],
};

// 재난 유형별 발생 설정 라벨/옵션 설정
const OCCUR_CONFIG = {
  지진: {
    locationLabel: "지진 피해 위치",
    intensityLabel: "지진 강도",
  },
  화재: {
    locationLabel: "화재 발생 위치",
    intensityLabel: "화재 강도",
  },
};

function ScenarioManagement() {
  // 재난 선택
  const [disasterType, setDisasterType] = useState("지진");

  // 발생 설정 상태
  const [fireSetting, setFireSetting] = useState("자동설정");
  const [fireLocation, setFireLocation] = useState("");
  const [fireIntensity, setFireIntensity] = useState("");
  const [trainingTime, setTrainingTime] = useState("");

  // 팀 설정 상태
  const [teamSetting, setTeamSetting] = useState("자동설정");
  const [teamCounts, setTeamCounts] = useState({});

  // NPC 설정 상태
  const [npcSetting, setNpcSetting] = useState("자동설정");
  const [npcPosition, setNpcPosition] = useState("");
  const [npcStatus, setNpcStatus] = useState("");

  // 참여자 설정
  const [participants, setParticipants] = useState("");

  const [saving, setSaving] = useState(false);

  // 드롭다운 옵션
  const fireLocations = ["1층", "2층", "3층", "4층"];
  const fireIntensities = ["약", "보통", "강"];
  const trainingTimes = ["5분", "10분", "15분", "30분"];
  const npcPositions = ["입구", "복도", "계단", "출구"];
  const npcStatuses = ["정상", "이상", "대기"];

  // 현재 선택된 재난 기준 팀 리스트
  const teamTypes = TEAM_TYPES_BY_DISASTER[disasterType] || [
    "팀A",
    "팀B",
    "팀C",
  ];

  // 현재 선택된 재난 기준 발생 설정 라벨
  const occurConfig = OCCUR_CONFIG[disasterType] || {
    locationLabel: "발생 위치",
    intensityLabel: "강도",
  };

  // 자동 설정 lock 여부 체크
  const isAllAuto =
    fireSetting === "자동설정" &&
    teamSetting === "자동설정" &&
    npcSetting === "자동설정";

  useEffect(() => {
    if (isAllAuto) {
      setFireLocation("");
      setFireIntensity("");
      setTrainingTime("");
      setNpcPosition("");
      setNpcStatus("");
      setTeamCounts({});
    }
  }, [isAllAuto]);

  useEffect(() => {
    setTeamCounts((prev) => {
      const next = {};
      teamTypes.forEach((team) => {
        next[team] = prev[team] || "";
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disasterType]);

  const handleTeamCountChange = (team, value) => {
    const onlyNumber = value.replace(/[^0-9]/g, "");
    setTeamCounts((prev) => ({
      ...prev,
      [team]: onlyNumber,
    }));
  };

  // 🔥 시나리오 저장 → POST /api/scenario
  const handleSaveScenario = async () => {
    try {
      setSaving(true);

      // 현재는 classroom_id를 하드코딩 (나중에 반 선택 시 교체)
      const classroomId = "c001";

      const scenarioType = disasterType === "화재" ? "FIRE" : "EARTHQUAKE"; // 프론트 기준 확장

      const triggerMode = fireSetting === "자동설정" ? "AUTO" : "MANUAL";
      const teamMode = teamSetting === "자동설정" ? "AUTO" : "MANUAL";
      const npcMode = npcSetting === "자동설정" ? "AUTO" : "MANUAL";

      // 강도 매핑 (프론트 기준 하드코딩)
      const intensityMap = { 약: 3, 보통: 5, 강: 7 };
      const intensity = intensityMap[fireIntensity] || 0;

      // "10분" → 10 정수
      const trainTime = trainingTime
        ? parseInt(trainingTime.replace("분", ""), 10)
        : 0;

      const payload = {
        classroom_id: classroomId,
        scenario_type: scenarioType,
        trigger_mode: triggerMode,
        team_mode: teamMode,
        npc_mode: npcMode,
        intensity,
        train_time: trainTime,
        // 필요하면 아래처럼 프론트 전용 필드도 함께 보낼 수 있음
        // fire_location: fireLocation,
        // npc_position: npcPosition,
        // npc_status: npcStatus,
        // participants: Number(participants || 0),
        // team_counts: teamCounts,
      };

      const res = await axios.post(`${API_BASE}/api/scenario`, payload);
      const data = res.data;

      if (data.status === "success") {
        alert("시나리오가 저장되었습니다.");
        // 필요하면 scenario_id(data.scenario_id) 로 상태 업데이트
      } else {
        alert(data.message || "시나리오 저장에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#F9FBE7] min-h-screen">
      <Navbar />
      <div className="p-8 space-y-6">
        <h2 className="text-3xl font-bold text-[#2E7D32] mb-4">
          시나리오 관리
        </h2>

        {/* 재난 선택하기 */}
        <div className="p-4 bg-white rounded shadow space-y-3">
          <h3 className="text-xl font-semibold text-[#2E7D32]">
            재난 선택하기
          </h3>
          <select
            value={disasterType}
            onChange={(e) => setDisasterType(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          >
            <option value="지진">지진</option>
            <option value="화재">화재</option>
          </select>
          <p className="text-sm text-gray-500">
            선택한 재난 유형에 따라 팀 역할과 발생 설정 항목이 자동으로
            변경됩니다.
          </p>
        </div>

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
              <label className="block mb-1">{occurConfig.locationLabel}</label>
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
              <label className="block mb-1">{occurConfig.intensityLabel}</label>
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

          <p className="text-sm text-gray-500">
            각 팀의 인원 수를 입력하면, 이후 훈련 시작 시 학생들이 랜덤으로 팀에
            배정될 수 있도록 사용할 수 있습니다.
          </p>

          <div className="grid grid-cols-3 gap-4">
            {teamTypes.map((team) => {
              const disabled = teamSetting === "자동설정" || isAllAuto;
              return (
                <div key={team} className="flex flex-col space-y-1">
                  <span className="font-medium">{team}</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="인원 수"
                    value={teamCounts[team] || ""}
                    onChange={(e) =>
                      handleTeamCountChange(team, e.target.value)
                    }
                    disabled={disabled}
                    className={`border px-2 py-2 rounded w-full text-right ${
                      disabled ? "bg-gray-100 opacity-50" : ""
                    }`}
                  />
                </div>
              );
            })}
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
          <button
            onClick={handleSaveScenario}
            disabled={saving}
            className="px-6 py-3 bg-[#2E7D32] text-white rounded-lg shadow disabled:opacity-60"
          >
            {saving ? "저장 중..." : "시나리오 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ScenarioManagement;
