// pages/CreateChannel.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE =
  "https://disaster-ar-backend-a7bvfvd8f6bxbsfh.koreacentral-01.azurewebsites.net"; // ✅ 끝 / 제거

function CreateChannel() {
  const [schoolName, setSchoolName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    const trimmed = schoolName.trim();
    if (!trimmed) {
      alert("학교 이름을 입력해 주세요.");
      return;
    }

    try {
      setLoading(true);

      // ✅ 백엔드 스펙: POST /api/channels
      // mapFile UI는 없으니 전송하지 않음(선택 필드일 때)
      const formData = new FormData();
      formData.append("schoolName", trimmed);

      const res = await axios.post(`${API_BASE}/api/channels`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 10000,
        validateStatus: () => true, // 4xx/5xx도 res로 받기
      });

      // 실패 처리
      if (!(res.status >= 200 && res.status < 300)) {
        const msg =
          res.data?.message ||
          res.data?.detail ||
          (typeof res.data === "string" ? res.data : null) ||
          `채널 생성 실패 (${res.status})`;
        alert(msg);
        return;
      }

      // ✅ 성공 응답(예상): { id, schoolName, mapFile, accessCode }
      const data = res.data || {};
      const channelId = data.id;
      const accessCode = data.accessCode;

      // 혹시 응답 키가 다를 수 있으니 최소한으로 안전하게 처리
      if (!channelId) {
        alert(
          `채널은 생성된 것 같은데 id가 응답에 없습니다.\n\n${JSON.stringify(
            data,
            null,
            2
          )}`
        );
        return;
      }

      // ✅ 화면에 mapFile은 보여줄 필요 없으니 state에 안 넣고,
      // 필요한 값만 들고 이동
      navigate("/room-list", {
        state: {
          channelId,
          schoolName: data.schoolName ?? trimmed,
          accessCode: accessCode ?? "UNKNOWN",
        },
      });
    } catch (err) {
      console.error(err);

      if (err.code === "ECONNABORTED") {
        alert("요청 시간이 초과되었습니다. (timeout)");
        return;
      }

      alert("서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
          채널 생성하기
        </h2>

        <input
          type="text"
          placeholder="학교 이름"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          className="w-full mb-6 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
        />

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-3 rounded-lg shadow"
        >
          {loading ? "생성 중..." : "학교 채널 생성하기"}
        </button>
      </div>
    </div>
  );
}

export default CreateChannel;
