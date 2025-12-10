// pages/CreateChannel.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = "http://localhost:8000";

function CreateChannel() {
  const [schoolName, setSchoolName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!schoolName.trim()) {
      alert("학교 이름을 입력해 주세요.");
      return;
    }

    try {
      setLoading(true);

      // 1) 채널 생성 요청 (지도 파일은 현재 UI에 없으므로 생략)
      const formData = new FormData();
      formData.append("school_name", schoolName);

      const createRes = await axios.post(
        `${API_BASE}/api/channel/create`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const createData = createRes.data;
      if (createData.status !== "success") {
        alert(createData.message || "채널 생성에 실패했습니다.");
        return;
      }

      const schoolId = createData.school_id;

      // 2) 학교 코드 조회
      let joinCode = "UNKNOWN";
      try {
        const codeRes = await axios.get(
          `${API_BASE}/api/school-channel/${schoolId}`
        );
        joinCode = codeRes.data.join_code || joinCode;
      } catch (err) {
        console.warn("학교 코드 조회 실패, 임시 코드 사용:", err);
      }

      // 3) room-list로 이동 (프론트는 기존대로 schoolName + schoolCode 사용)
      navigate("/room-list", {
        state: {
          schoolName,
          schoolCode: joinCode,
          schoolId,
        },
      });
    } catch (err) {
      console.error(err);
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
