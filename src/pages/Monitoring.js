import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

function Monitoring() {
  const [students, setStudents] = useState([]);
  const [backgroundImage, setBackgroundImage] = useState(null);

  // 예시: 랜덤 학생 위치 생성
  useEffect(() => {
    const exampleStudents = [
      { id: 1, name: "학생A", x: 50, y: 80, status: "대피 중" },
      { id: 2, name: "학생B", x: 200, y: 120, status: "제한 구역 진입" },
      { id: 3, name: "학생C", x: 150, y: 200, status: "화재 구역 진입" },
    ];
    setStudents(exampleStudents);
  }, []);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setBackgroundImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Navbar />

      <div className="p-8 flex flex-col space-y-6">
        <h2 className="text-3xl font-bold text-[#2E7D32] mb-4">
          실시간 모니터링
        </h2>
        <p className="text-gray-600">
          모니터링 화면과 현재 현황을 통해 학생들의 실시간 상황을 볼 수
          있습니다.
        </p>

        {/* 이미지 업로드 */}
        <div className="mb-4">
          <label className="block font-medium mb-2">대피도 업로드</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="border px-3 py-2 rounded"
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* 모니터링 화면 */}
          <div className="relative flex-1 bg-white border rounded shadow">
            {backgroundImage ? (
              <img
                src={backgroundImage}
                alt="대피도"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                대피도를 업로드 해주세요.
              </div>
            )}

            {/* 학생 위치 표시 */}
            {students.map((student) => (
              <div
                key={student.id}
                style={{
                  position: "absolute",
                  left: `${student.x}px`,
                  top: `${student.y}px`,
                }}
                className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"
                title={`${student.name} - ${student.status}`}
              />
            ))}
          </div>

          {/* 현재 현황 */}
          <div className="w-80 bg-white p-4 rounded shadow overflow-y-auto">
            <h3 className="text-xl font-semibold text-[#2E7D32] mb-4">
              현재 현황
            </h3>
            <div className="flex flex-col space-y-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{student.name}</span>
                    <span className="text-sm text-gray-500">
                      위치: ({student.x}, {student.y})
                    </span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      student.status === "대피 중"
                        ? "bg-green-200 text-green-800"
                        : student.status === "제한 구역 진입"
                        ? "bg-yellow-200 text-yellow-800"
                        : "bg-red-200 text-red-800"
                    }`}
                  >
                    {student.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Monitoring;
