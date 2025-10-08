import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function CreateChannel() {
  const [schoolName, setSchoolName] = useState("");
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleCreate = () => {
    console.log("학교이름:", schoolName);
    console.log("업로드 파일:", file);
    navigate("/school-channel");
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
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-4 w-full"
        />
        <button
          onClick={handleCreate}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg shadow"
        >
          학교 채널 생성하기
        </button>
      </div>
    </div>
  );
}

export default CreateChannel;
