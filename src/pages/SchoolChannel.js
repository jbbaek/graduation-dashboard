import React, { useState } from "react";
import Navbar from "../components/Navbar";

function SchoolChannel() {
  const [roomCode, setRoomCode] = useState(generateCode());
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState("");

  // 랜덤 방 코드 생성 함수
  function generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  const handleNewCode = () => {
    setRoomCode(generateCode());
    setStudents([]);
  };

  const handleAddStudent = () => {
    if (newStudent.trim() === "") return;
    setStudents([...students, newStudent]);
    setNewStudent("");
  };

  const handleRemoveStudent = (index) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-[#F9FBE7] min-h-screen">
      <Navbar />
      <div className="p-8">
        <h2 className="text-3xl font-bold text-[#2E7D32] mb-4">
          학교 채널 메인 화면
        </h2>
        <p className="text-[#555] mb-6">채널 관련 내용이 여기에 표시됩니다.</p>

        {/* 방 코드 표시 및 버튼 */}
        <div className="mb-6">
          <p className="text-xl font-semibold text-[#2E7D32] mb-2">
            현재 방 코드: <span className="text-[#FBC02D]">{roomCode}</span>
          </p>
          <button
            onClick={handleNewCode}
            className="px-4 py-2 bg-[#66BB6A] text-white rounded-lg shadow hover:bg-[#2E7D32] mr-3"
          >
            새 코드 생성
          </button>
          <button
            onClick={() => alert("훈련을 시작합니다!")}
            className="px-4 py-2 bg-[#FBC02D] text-white font-bold rounded-lg shadow hover:bg-[#F9A825]"
          >
            훈련 시작
          </button>
        </div>

        {/* 학생 입장 관리 */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-[#2E7D32] mb-3">학생 입장</h3>
          <div className="flex items-center mb-3">
            <input
              type="text"
              placeholder="학생 이름 입력"
              value={newStudent}
              onChange={(e) => setNewStudent(e.target.value)}
              className="px-3 py-2 border border-[#81C784] rounded-l-md w-64 focus:outline-none focus:ring-2 focus:ring-[#66BB6A]"
            />
            <button
              onClick={handleAddStudent}
              className="px-4 py-2 bg-[#81C784] text-white rounded-r-md hover:bg-[#2E7D32]"
            >
              추가
            </button>
          </div>

          {/* 학생 리스트 */}
          <ul className="space-y-2">
            {students.map((student, index) => (
              <li
                key={index}
                className="flex items-center justify-between px-4 py-2 bg-white border-l-4 border-[#66BB6A] rounded-lg shadow"
              >
                <span className="text-[#2E7D32] font-medium">{student}</span>
                <button
                  onClick={() => handleRemoveStudent(index)}
                  className="px-3 py-1 bg-[#F44336] text-white text-sm rounded hover:bg-[#C62828]"
                >
                  퇴출
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SchoolChannel;
