import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Navbar from "../components/Navbar";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function safeJsonParse(value, fallback = {}) {
  if (!value) return fallback;

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("JSON parse 실패:", value, error);
    return fallback;
  }
}

function formatScore(value) {
  const numberValue = Number(value || 0);
  return `${numberValue.toFixed(1)}점`;
}

function AnalysisResult() {
  const { scenarioId } = useParams();

  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");

  const [scenarioEvaluation, setScenarioEvaluation] = useState(null);
  const [studentEvaluations, setStudentEvaluations] = useState([]);
  const [studentNameMap, setStudentNameMap] = useState({});

  // ✅ 퇴출된 학생 ID만 저장
  const [kickedStudentIdSet, setKickedStudentIdSet] = useState(new Set());

  // ✅ 학생별 AI 텍스트 피드백
  const [studentFeedbackMap, setStudentFeedbackMap] = useState({});
  const [feedbackErrorMap, setFeedbackErrorMap] = useState({});
  const [generatingFeedback, setGeneratingFeedback] = useState(false);

  // ✅ 동일한 시나리오에서 AI 피드백이 중복 호출되는 것을 방지
  const autoFeedbackScenarioRef = useRef("");

  const fetchEvaluations = useCallback(async () => {
    if (!scenarioId) {
      setError("scenarioId가 없습니다. 라우터 경로를 확인해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/scenarios/${scenarioId}/evaluations`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`평가 결과 조회 실패: ${response.status}`);
      }

      const data = await response.json();

      setScenarioEvaluation(data.scenarioEvaluation || null);
      setStudentEvaluations(data.studentEvaluations || []);
    } catch (err) {
      console.error(err);
      setError("평가 결과를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [scenarioId]);

  const runEvaluate = useCallback(async () => {
    if (!scenarioId) {
      setError("scenarioId가 없습니다. 평가를 실행할 수 없습니다.");
      return;
    }

    setEvaluating(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/scenarios/${scenarioId}/evaluate`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`평가 실행 실패: ${response.status}`);
      }

      /*
  evaluate 응답에도 studentEvaluations가 들어오지만,
  백엔드 정책상 기존 평가 삭제 후 최신 평가 저장이므로
  evaluate 실행 후 evaluations를 다시 조회해서 화면을 최신 저장 결과 기준으로 맞춘다.
*/

      // ✅ 재평가 후 AI 피드백도 다시 생성할 수 있도록 초기화
      autoFeedbackScenarioRef.current = "";
      setStudentFeedbackMap({});
      setFeedbackErrorMap({});

      await fetchEvaluations();
    } catch (err) {
      console.error(err);
      setError("평가 실행에 실패했습니다.");
    } finally {
      setEvaluating(false);
    }
  }, [scenarioId, fetchEvaluations]);

  useEffect(() => {
    if (scenarioId) {
      fetchEvaluations();
    }
  }, [scenarioId, fetchEvaluations]);

  useEffect(() => {
    const fetchStudentNames = async () => {
      let roomContext = {};

      try {
        roomContext = JSON.parse(localStorage.getItem("roomContext") || "{}");
      } catch {
        roomContext = {};
      }

      const classroomId =
        localStorage.getItem("classroomId") || roomContext?.classroomId || null;

      if (!classroomId) {
        console.warn("[AnalysisResult] classroomId가 없어 학생 이름 조회 생략");
        return;
      }

      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          `${API_BASE_URL}/api/rooms/${classroomId}/students`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },
          },
        );

        if (!response.ok) {
          throw new Error(`학생 목록 조회 실패: ${response.status}`);
        }

        const students = await response.json();

        const nextMap = {};
        const nextKickedStudentIds = new Set();

        if (Array.isArray(students)) {
          students.forEach((student) => {
            const rawStudentId =
              student?.studentId ?? student?.id ?? student?.student_id;

            if (!rawStudentId) return;

            const studentId = String(rawStudentId);

            nextMap[studentId] =
              student.studentName || student.name || "이름 없음";

            // ✅ 백엔드 응답 형식이 조금 달라도 퇴출 여부 판별
            const isKicked =
              student.isKicked === true ||
              student.kicked === true ||
              String(student.status || "").toUpperCase() === "KICKED" ||
              String(student.status || "").toUpperCase() === "EXPELLED";

            if (isKicked) {
              nextKickedStudentIds.add(studentId);
            }
          });
        }

        setStudentNameMap(nextMap);
        setKickedStudentIdSet(nextKickedStudentIds);
      } catch (err) {
        console.error("[AnalysisResult] 학생 이름 조회 실패", err);
      }
    };

    fetchStudentNames();
  }, []);

  const getStudentName = (student) => {
    if (!student) return "이름 없음";

    return (
      student.studentName ||
      student.name ||
      studentNameMap[String(student.studentId || "")] ||
      "이름 없음"
    );
  };

  const getStudentKey = (student) => {
    return String(
      student?.evaluationId ??
        student?.evaluation_id ??
        student?.studentEvaluationId ??
        student?.studentId ??
        student?.id ??
        student?.student_id ??
        "",
    );
  };

  const getStudentId = (student) => {
    const rawStudentId = student?.studentId ?? student?.student_id ?? null;

    return rawStudentId ? String(rawStudentId) : "";
  };

  const generateStudentFeedbacks = async () => {
    if (parsedStudentEvaluations.length === 0) {
      setError("AI 피드백을 생성할 학생 평가 결과가 없습니다.");
      return;
    }

    setGeneratingFeedback(true);
    setError("");
    setFeedbackErrorMap({});

    const nextFeedbackMap = {};
    const nextErrorMap = {};

    try {
      for (const student of parsedStudentEvaluations) {
        const studentKey = getStudentKey(student);
        const studentId = getStudentId(student);

        if (!studentKey) {
          console.warn(
            "[AnalysisResult] studentKey가 없어 피드백 요청을 생략합니다.",
            student,
          );
          continue;
        }

        if (!studentId) {
          console.error("[AnalysisResult] 실제 studentId가 없습니다.", {
            scenarioId,
            student,
          });

          nextErrorMap[studentKey] = "AI 피드백 생성에 실패했습니다.";

          continue;
        }

        const feedbackUrl =
          `${API_BASE_URL}/api/ai/scenarios/` +
          `${encodeURIComponent(scenarioId)}/students/` +
          `${encodeURIComponent(studentId)}/feedback`;

        try {
          console.log("[AnalysisResult] AI 피드백 요청", {
            scenarioId,
            studentId,
            studentName: getStudentName(student),
            feedbackUrl,
          });

          const response = await fetch(feedbackUrl, {
            method: "POST",
            headers: {
              Accept: "application/json",
            },

            // 중요: body를 넣지 않음
          });

          const responseText = await response.text();

          if (!response.ok) {
            let errorData = {};

            try {
              errorData = responseText ? JSON.parse(responseText) : {};
            } catch {
              errorData = {};
            }

            console.error("[AnalysisResult] AI 피드백 API 실패", {
              status: response.status,
              scenarioId,
              studentId,
              responseText,
              errorData,
            });

            throw new Error("AI 피드백 생성에 실패했습니다.");
          }

          const data = responseText ? JSON.parse(responseText) : {};

          if (typeof data.result !== "string" || !data.result.trim()) {
            throw new Error("AI 피드백 생성에 실패했습니다.");
          }

          // 백엔드 result를 그대로 저장
          nextFeedbackMap[studentKey] = data.result;
        } catch (studentError) {
          console.error("[AnalysisResult] 학생별 AI 피드백 생성 실패", {
            scenarioId,
            studentId,
            studentName: getStudentName(student),
            error: studentError,
          });

          nextErrorMap[studentKey] = "AI 피드백 생성에 실패했습니다.";
        }

        // AI 서버에 요청이 몰리지 않도록 짧게 대기
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      setStudentFeedbackMap((prev) => ({
        ...prev,
        ...nextFeedbackMap,
      }));

      setFeedbackErrorMap(nextErrorMap);
    } finally {
      setGeneratingFeedback(false);
    }
  };

  // ✅ 평가 결과를 화면 표시용 형태로 변환
  const parsedStudentEvaluations = useMemo(() => {
    const currentScenarioId = String(scenarioId || "");

    const normalized = studentEvaluations
      .map((student) => {
        const scoreJson = safeJsonParse(student.scoreJson, {});
        const detailsJson = safeJsonParse(student.detailsJson, {});

        return {
          ...student,
          scoreJson,
          detailsJson,
        };
      })
      .filter((student) => {
        const rawStudentId =
          student?.studentId ?? student?.id ?? student?.student_id;

        if (!rawStudentId) {
          return false;
        }

        const studentId = String(rawStudentId);

        // 퇴출 학생 제외
        if (kickedStudentIdSet.has(studentId)) {
          return false;
        }

        // 응답에 scenarioId가 들어있으면 현재 scenarioId와 같은 것만 사용
        const evaluationScenarioId =
          student?.scenarioId ??
          student?.scenario_id ??
          student?.trainingScenarioId ??
          student?.scenarioEvaluation?.scenarioId;

        if (
          evaluationScenarioId !== undefined &&
          evaluationScenarioId !== null &&
          String(evaluationScenarioId) !== currentScenarioId
        ) {
          return false;
        }

        return true;
      });

    // 같은 학생 평가가 여러 개 있으면 최신 1개만 남김
    const latestByStudentId = new Map();

    normalized.forEach((student) => {
      const studentId = String(
        student?.studentId ?? student?.id ?? student?.student_id,
      );

      const prev = latestByStudentId.get(studentId);

      if (!prev) {
        latestByStudentId.set(studentId, student);
        return;
      }

      const prevTime = new Date(
        prev.updatedAt ?? prev.createdAt ?? prev.evaluatedAt ?? 0,
      ).getTime();

      const currentTime = new Date(
        student.updatedAt ?? student.createdAt ?? student.evaluatedAt ?? 0,
      ).getTime();

      if (currentTime >= prevTime) {
        latestByStudentId.set(studentId, student);
      }
    });

    return Array.from(latestByStudentId.values());
  }, [studentEvaluations, kickedStudentIdSet, scenarioId]);

  const parsedStudentEvaluationKey = useMemo(() => {
    return parsedStudentEvaluations
      .map((student) => getStudentKey(student))
      .join("|");
  }, [parsedStudentEvaluations]);

  // ✅ 시나리오가 변경되면 이전 AI 피드백 초기화
  useEffect(() => {
    autoFeedbackScenarioRef.current = "";
    setStudentFeedbackMap({});
    setFeedbackErrorMap({});
  }, [scenarioId]);

  // ✅ 평가 데이터 로딩 직후 학생별 AI 피드백 자동 생성
  useEffect(() => {
    if (!scenarioId) {
      return;
    }

    if (parsedStudentEvaluations.length === 0) {
      return;
    }

    if (generatingFeedback) {
      return;
    }

    const feedbackRunKey = `${scenarioId}:${parsedStudentEvaluationKey}`;

    if (autoFeedbackScenarioRef.current === feedbackRunKey) {
      return;
    }

    autoFeedbackScenarioRef.current = feedbackRunKey;
    generateStudentFeedbacks();

    // generateStudentFeedbacks는 현재 평가 결과를 기준으로 한 번만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId, parsedStudentEvaluationKey]);

  const summaryData = useMemo(() => {
    // ✅ 퇴출 학생 제외 후 남은 학생 수
    const studentCount = parsedStudentEvaluations.length;

    // ✅ 퇴출 학생 제외 후 총 학생 점수
    const totalStudentScore = parsedStudentEvaluations.reduce(
      (sum, student) =>
        sum + Number(student.scoreTotal ?? student.scoreJson?.total ?? 0),
      0,
    );

    // ✅ 퇴출 학생 제외 후 평균 점수
    const averageScore =
      studentCount > 0 ? totalStudentScore / studentCount : 0;

    // ✅ 퇴출 학생 제외 후 안전구역 도착 학생 수
    const safezoneCompletedCount = parsedStudentEvaluations.filter(
      (student) =>
        (student.safeZoneCompleted ??
          student.detailsJson?.safeZoneCompleted) === true,
    ).length;

    // ✅ 퇴출 학생 제외 후 정답 퀴즈 총합
    const totalCorrectQuizCount = parsedStudentEvaluations.reduce(
      (sum, student) =>
        sum +
        Number(
          student.correctQuizCount ??
            student.detailsJson?.correctQuizCount ??
            0,
        ),
      0,
    );

    return {
      studentCount,
      averageScore,
      totalStudentScore,
      safezoneCompletedCount,
      totalCorrectQuizCount,
    };
  }, [parsedStudentEvaluations]);

  return (
    <div className="bg-[#f7f8fa] min-h-screen">
      <Navbar />

      <div className="p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#2E7D32]">분석 결과</h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={runEvaluate}
              disabled={evaluating || loading || generatingFeedback}
              className={`px-5 py-2 rounded-lg text-white font-semibold shadow ${
                evaluating || loading || generatingFeedback
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#2E7D32] hover:bg-[#256428]"
              }`}
            >
              {evaluating ? "평가 계산 중..." : "평가 다시 계산"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {(loading || evaluating || generatingFeedback) && (
          <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg text-gray-600">
            {generatingFeedback
              ? "학생별 AI 피드백을 생성하는 중입니다."
              : "평가 데이터를 불러오는 중입니다."}
          </div>
        )}

        {/* 전체 분석 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
            <span className="text-base font-semibold text-gray-500">
              평균 점수
            </span>
            <span className="text-3xl font-bold text-[#2E7D32] mt-2">
              {formatScore(summaryData.averageScore)}
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
            <span className="text-base font-semibold text-gray-500">
              평가 학생 수
            </span>
            <span className="text-3xl font-bold text-[#2E7D32] mt-2">
              {summaryData.studentCount}명
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
            <span className="text-base font-semibold text-gray-500">
              총 학생 점수
            </span>
            <span className="text-3xl font-bold text-[#2E7D32] mt-2">
              {formatScore(summaryData.totalStudentScore)}
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
            <span className="text-base font-semibold text-gray-500">
              안전구역 도착
            </span>
            <span className="text-3xl font-bold text-[#2E7D32] mt-2">
              {summaryData.safezoneCompletedCount}명
            </span>
          </div>
        </div>

        {/* 점수 기준 안내 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-[#2E7D32] mb-4">
            평가 점수 기준
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4 bg-green-50">
              <p className="font-bold text-[#2E7D32]">퀴즈 점수</p>
              <p className="text-sm text-gray-600 mt-1">정답 퀴즈 개수 × 6점</p>
            </div>

            <div className="border rounded-lg p-4 bg-blue-50">
              <p className="font-bold text-blue-700">역할 점수</p>
              <p className="text-sm text-gray-600 mt-1">
                소화기 획득, 소화기 퀴즈, 화재 진압 참여
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-yellow-50">
              <p className="font-bold text-yellow-700">개인 점수</p>
              <p className="text-sm text-gray-600 mt-1">
                랜덤 퀴즈, 119 신고, 소화기 찾기
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-purple-50">
              <p className="font-bold text-purple-700">안전구역 점수</p>
              <p className="text-sm text-gray-600 mt-1">
                안전구역 도착 완료 시 10점
              </p>
            </div>
          </div>
        </div>

        {/* 개별 학생 결과 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-semibold text-[#2E7D32]">
              개별 학생 평가 결과
            </h3>

            <span className="text-sm text-gray-500">
              정답 퀴즈 총 {summaryData.totalCorrectQuizCount}개
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-[#2E7D32] text-white">
                <tr>
                  <th className="px-4 py-3 border whitespace-nowrap">학생명</th>
                  <th className="px-4 py-3 border whitespace-nowrap">
                    배정 역할
                  </th>
                  <th className="px-4 py-3 border whitespace-nowrap">총점</th>
                  <th className="px-4 py-3 border whitespace-nowrap">퀴즈</th>
                  <th className="px-4 py-3 border whitespace-nowrap">
                    역할 점수
                  </th>
                  <th className="px-4 py-3 border whitespace-nowrap">개인</th>
                  <th className="px-4 py-3 border whitespace-nowrap">
                    안전구역
                  </th>
                  <th className="px-4 py-3 border whitespace-nowrap">
                    정답 퀴즈
                  </th>
                  <th className="px-4 py-3 border whitespace-nowrap">
                    안전구역 완료
                  </th>
                  <th className="px-4 py-3 border whitespace-nowrap">피드백</th>
                </tr>
              </thead>

              <tbody>
                {parsedStudentEvaluations.length === 0 ? (
                  <tr>
                    <td
                      colSpan="10"
                      className="px-4 py-8 text-center text-gray-500 border"
                    >
                      평가 결과가 없습니다.
                    </td>
                  </tr>
                ) : (
                  parsedStudentEvaluations.map((student) => {
                    const quizScore =
                      student.quizScore ?? student.scoreJson?.quiz ?? 0;

                    const roleScore =
                      student.roleScore ?? student.scoreJson?.role ?? 0;

                    const personalScore =
                      student.personalScore ?? student.scoreJson?.personal ?? 0;

                    const safezoneScore =
                      student.safezoneScore ?? student.scoreJson?.safezone ?? 0;

                    const totalScore =
                      student.scoreTotal ?? student.scoreJson?.total ?? 0;

                    const correctQuizCount =
                      student.correctQuizCount ??
                      student.detailsJson?.correctQuizCount ??
                      0;

                    const safeZoneCompleted =
                      student.safeZoneCompleted ??
                      student.detailsJson?.safeZoneCompleted;

                    const studentKey = getStudentKey(student);

                    const generatedFeedback = studentFeedbackMap[studentKey];

                    const feedbackError = feedbackErrorMap[studentKey];

                    return (
                      <tr
                        key={student.evaluationId || student.studentId}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 border font-medium whitespace-nowrap">
                          {getStudentName(student)}
                        </td>

                        <td className="px-4 py-3 border text-center whitespace-nowrap">
                          {student.teamName || student.teamCode || "-"}
                        </td>

                        <td className="px-4 py-3 border text-center font-bold text-[#2E7D32] whitespace-nowrap">
                          {formatScore(totalScore)}
                        </td>

                        <td className="px-4 py-3 border text-center whitespace-nowrap">
                          {formatScore(quizScore)}
                        </td>

                        <td className="px-4 py-3 border text-center whitespace-nowrap">
                          {formatScore(roleScore)}
                        </td>

                        <td className="px-4 py-3 border text-center whitespace-nowrap">
                          {formatScore(personalScore)}
                        </td>

                        <td className="px-4 py-3 border text-center whitespace-nowrap">
                          {formatScore(safezoneScore)}
                        </td>

                        <td className="px-4 py-3 border text-center whitespace-nowrap">
                          {correctQuizCount}개
                        </td>

                        <td className="px-4 py-3 border text-center whitespace-nowrap">
                          {safeZoneCompleted === true ? (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              완료
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                              미완료
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 border text-gray-600 min-w-[320px]">
                          {feedbackError ? (
                            <span className="text-red-600">
                              {feedbackError}
                            </span>
                          ) : generatedFeedback ? (
                            <ReactMarkdown
                              components={{
                                h1: ({ children }) => (
                                  <h1 className="text-xl font-bold text-[#2E7D32] mb-3">
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-lg font-bold text-[#2E7D32] mt-3 mb-2">
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="font-bold text-[#2E7D32] mt-3 mb-1">
                                    {children}
                                  </h3>
                                ),
                                p: ({ children }) => (
                                  <p className="mb-2 last:mb-0">{children}</p>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-bold text-gray-900">
                                    {children}
                                  </strong>
                                ),
                                ul: ({ children }) => (
                                  <ul className="list-disc pl-5 my-2 space-y-1">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="list-decimal pl-5 my-2 space-y-1">
                                    {children}
                                  </ol>
                                ),
                              }}
                            >
                              {generatedFeedback}
                            </ReactMarkdown>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalysisResult;
