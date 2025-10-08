import React, { useState } from "react";
import Navbar from "../components/Navbar";

function AnalysisResult() {
  const [analysisData] = useState({
    successRate: "85%",
    avgEvacTime: "12분 30초",
    warningCount: 5,
    dangerZoneEntries: 3,
  });

  const [studentResults] = useState([
    {
      name: "학생A",
      evacTime: "11분 20초",
      missionsCompleted: "3/3",
      emotion: " ",
    },
    {
      name: "학생B",
      evacTime: "13분 10초",
      missionsCompleted: "2/3",
      emotion: "잘못된 경로 선택",
    },
    {
      name: "학생C",
      evacTime: "12분 50초",
      missionsCompleted: "1/3",
      emotion: "소화기 사용법 미숙지",
    },
  ]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="p-8 space-y-6">
        <h2 className="text-3xl font-bold text-[#2E7D32] mb-4">분석 결과</h2>

        {/* 전체 분석 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-4 rounded shadow flex flex-col items-center">
            <span className="text-lg font-semibold text-[#66BB6A]">
              전체 성공률
            </span>
            <span className="text-2xl font-bold">
              {analysisData.successRate}
            </span>
          </div>
          <div className="bg-white p-4 rounded shadow flex flex-col items-center">
            <span className="text-lg font-semibold text-[#81C784]">
              평균 대피 시간
            </span>
            <span className="text-2xl font-bold">
              {analysisData.avgEvacTime}
            </span>
          </div>
          <div className="bg-white p-4 rounded shadow flex flex-col items-center">
            <span className="text-lg font-semibold text-[#FBC02D]">
              경고 발생 건수
            </span>
            <span className="text-2xl font-bold">
              {analysisData.warningCount}
            </span>
          </div>
          <div className="bg-white p-4 rounded shadow flex flex-col items-center">
            <span className="text-lg font-semibold text-[#2E7D32]">
              위험 구역 진입 횟수
            </span>
            <span className="text-2xl font-bold">
              {analysisData.dangerZoneEntries}
            </span>
          </div>
        </div>

        {/* 개별 학생 결과 */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-2xl font-semibold text-[#2E7D32] mb-4">
            개별 학생 결과
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-[#2E7D32] text-white">
                <tr>
                  <th className="px-4 py-2 border">학생명</th>
                  <th className="px-4 py-2 border">대피시간</th>
                  <th className="px-4 py-2 border">미션 완료 갯수</th>
                  <th className="px-4 py-2 border">감점 사유</th>
                </tr>
              </thead>
              <tbody>
                {studentResults.map((student, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">{student.name}</td>
                    <td className="px-4 py-2 border">{student.evacTime}</td>
                    <td className="px-4 py-2 border">
                      {student.missionsCompleted}
                    </td>
                    <td className="px-4 py-2 border">{student.emotion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalysisResult;
