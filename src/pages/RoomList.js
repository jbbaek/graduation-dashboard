// pages/RoomList.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function RoomList() {
  const location = useLocation();
  const navigate = useNavigate();

  const schoolName = location.state?.schoolName || "중부초등학교";
  const schoolCode = location.state?.schoolCode || "ABC123";

  const [rooms, setRooms] = useState([
    { id: 1, name: "3학년 1반", studentCount: 20 },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newStudentCount, setNewStudentCount] = useState("");

  const openModal = () => {
    setNewRoomName("");
    setNewStudentCount("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleCreateRoom = () => {
    if (!newRoomName.trim() || !newStudentCount.trim()) return;

    setRooms((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newRoomName.trim(),
        studentCount: Number(newStudentCount),
      },
    ]);

    closeModal();
  };

  const goToSchoolChannel = (room) => {
    navigate("/school-channel", {
      state: {
        roomId: room.id,
        roomName: room.name,
        studentCount: room.studentCount,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex justify-center items-start py-10">
      {/* 전체 박스 */}
      <div className="w-full max-w-3xl bg-white border border-green-500 rounded-3xl shadow-sm px-8 py-6 space-y-6">
        {/* 학교 카드 */}
        <div className="w-full bg-white border border-green-500 rounded-3xl px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-4">{schoolName}</h2>
            <div className="inline-block bg-[#FBC02D] text-black font-bold px-6 py-3 rounded-2xl">
              학교코드: {schoolCode}
            </div>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100">
            <span role="img" aria-label="settings">
              ⚙️
            </span>
          </button>
        </div>

        {/* 방 리스트 박스 */}
        <div className="w-full border border-green-500 rounded-3xl px-6 py-4 space-y-4">
          {/* 상단 + 버튼 라인 */}
          <div className="flex justify-end">
            <button
              onClick={openModal}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-green-500 text-green-600 text-2xl font-bold hover:bg-green-50"
            >
              +
            </button>
          </div>

          {/* 각 반 카드 */}
          {rooms.map((room) => (
            <div
              key={room.id}
              className="border border-green-300 rounded-2xl px-5 py-3 shadow-sm flex items-center justify-between"
            >
              <div>
                <div className="text-xl font-bold mb-1">{room.name}</div>
                <div className="text-sm text-gray-700">
                  학생 수 {room.studentCount}명
                </div>
              </div>

              <button
                onClick={() => goToSchoolChannel(room)}
                className="px-6 py-2 rounded-full border border-green-400 bg-white text-green-700 font-semibold shadow-sm hover:bg-green-50"
              >
                관리
              </button>
            </div>
          ))}

          {rooms.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-8">
              아직 생성된 반이 없습니다. 상단 + 버튼을 눌러 방을 생성해 주세요.
            </p>
          )}
        </div>
      </div>

      {/* 방 생성 팝업 */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-5 text-center">방 생성하기</h3>

            <input
              type="text"
              placeholder="반 이름(예: 1학년 1반)"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="w-full mb-3 px-3 py-3 border border-green-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-300 placeholder:text-gray-400"
            />

            <input
              type="number"
              placeholder="학생 수"
              value={newStudentCount}
              onChange={(e) =>
                setNewStudentCount(e.target.value.replace(/[^0-9]/g, ""))
              }
              className="w-full mb-5 px-3 py-3 border border-green-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-300 placeholder:text-gray-400"
            />

            <button
              onClick={handleCreateRoom}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-2xl shadow"
            >
              방 생성하기
            </button>

            <button
              onClick={closeModal}
              className="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-700"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomList;
