import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

function SchoolChannel() {
  const location = useLocation();
  const navigate = useNavigate();

  const TEAM_NAME_BY_CODE = {
    FIRE: "소화팀",
    CIVILIAN: "시민",
    EMERGENCY: "응급팀",
  };

  const storedRoomContext = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("roomContext") || "{}");
    } catch {
      return {};
    }
  }, []);

  const classroomId =
    location.state?.classroomId ||
    location.state?.roomId ||
    storedRoomContext?.classroomId ||
    null;

  const userId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      return user?.userId || user?.id || null;
    } catch {
      return null;
    }
  }, []);

  const initialJoinCode =
    location.state?.joinCode || storedRoomContext?.joinCode || "UNKNOWN";
  const [joinCode, setJoinCode] = useState(initialJoinCode);

  const [className, setClassName] = useState(
    location.state?.className ||
      location.state?.roomName ||
      storedRoomContext?.className ||
      "교실",
  );

  const [studentCount, setStudentCount] = useState(
    Number(
      location.state?.studentCount ?? storedRoomContext?.studentCount ?? 0,
    ),
  );

  const [students, setStudents] = useState([]);
  const [studentLoading, setStudentLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editClassName, setEditClassName] = useState(className);
  const [editStudentCount, setEditStudentCount] = useState(
    String(studentCount),
  );

  // game-start-context / training 상태 표시용
  const [gameContext, setGameContext] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("gameContext") || "null");
    } catch {
      return null;
    }
  });

  // ✅ 화면에 표시할 남은 훈련 시간
  const [remainingSeconds, setRemainingSeconds] = useState(null);

  // 자동 종료 API 중복 호출 방지
  const autoEndRequestedRef = useRef(false);

  // ✅ 마지막으로 종료된 훈련의 분석 결과 조회용 scenarioId
  const [resultScenarioId, setResultScenarioId] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("lastResultContext") || "{}",
      );

      return saved?.scenarioId || null;
    } catch {
      return null;
    }
  });

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const showError = (title, resOrErr) => {
    if (resOrErr?.status) {
      const data = resOrErr.data;
      alert(
        `${title} (${resOrErr.status})\n\n${
          typeof data === "string" ? data : JSON.stringify(data, null, 2)
        }`,
      );
      return;
    }
    alert(`${title}\n\n${resOrErr?.message || "알 수 없는 오류"}`);
  };

  const getIsoNow = () => new Date().toISOString();

  const getStoredGameContext = () => {
    try {
      return JSON.parse(localStorage.getItem("gameContext") || "{}");
    } catch {
      return {};
    }
  };

  const getTrainingDurationMs = (context) => {
    if (!context) return null;

    // ✅ 진짜 초 단위로 내려오는 필드
    const durationSeconds = Number(
      context.trainingDurationSeconds ??
        context.durationSeconds ??
        context.timeLimitSeconds,
    );

    if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
      return durationSeconds * 1000;
    }

    // ✅ 현재 백엔드의 trainingTimeSeconds는
    // 이름은 Seconds지만 실제 값은 시나리오의 "분" 값
    const durationMinutes = Number(
      context.trainingTimeSeconds ??
        context.trainTime ??
        context.trainingDurationMinutes ??
        context.durationMinutes ??
        context.trainingTime ??
        context.timeLimit,
    );

    if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
      return durationMinutes * 60 * 1000;
    }

    return null;
  };

  // ✅ 남은 시간을 10:00 형태로 표시
  const formatRemainingTime = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds === undefined) {
      return "--:--";
    }

    const safeSeconds = Math.max(0, Number(totalSeconds) || 0);

    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0",
    )}`;
  };

  const buildTeamDistributePayload = (storedContext) => {
    const mode = String(storedContext?.teamMode || "AUTO").toUpperCase();

    if (mode !== "MANUAL") {
      return {
        mode: "AUTO",
      };
    }

    let parsedCounts = {};

    try {
      parsedCounts =
        typeof storedContext?.teamAssignmentJson === "string"
          ? JSON.parse(storedContext.teamAssignmentJson || "{}")
          : storedContext?.teamAssignmentJson || {};
    } catch {
      parsedCounts = {};
    }

    const manualTeamCounts = Object.entries(parsedCounts)
      .map(([teamCode, count]) => ({
        teamCode,
        teamName: TEAM_NAME_BY_CODE[teamCode] || teamCode,
        maxMembers: Number(count || 0),
      }))
      .filter((team) => team.maxMembers > 0);

    if (manualTeamCounts.length === 0) {
      throw new Error(
        "수동 팀 설정이 선택되어 있지만 팀별 인원 수가 저장되지 않았습니다.",
      );
    }

    return {
      mode: "MANUAL",
      manualTeamCounts,
    };
  };

  const saveGameContext = (data) => {
    const prev = getStoredGameContext();

    const next = {
      ...prev,
      ...(data || {}),

      // ✅ game-start-context 응답에 값이 없어도 기존 팀 설정 유지
      teamMode: data?.teamMode ?? prev?.teamMode ?? "AUTO",

      teamAssignmentJson:
        data?.teamAssignmentJson ?? prev?.teamAssignmentJson ?? "{}",
    };

    localStorage.setItem("gameContext", JSON.stringify(next));
    setGameContext(next);
  };

  const getStudentDisplayStatus = (student) => {
    const studentTrainingState = student?.trainingState;
    const roomTrainingState = gameContext?.trainingState;

    /*
     * 학생에게 trainingState가 내려오면 학생 상태를 우선 사용합니다.
     *
     * 이전 훈련이 ENDED인 상태에서 새 학생이 입장한 경우에는
     * localStorage에 남아 있는 방 상태 때문에 "훈련 종료"가 표시되지 않도록
     * 학생 입장 시간과 이전 훈련 종료 시간을 비교합니다.
     */
    const joinedAt = new Date(
      student?.joinedAt ||
        student?.createdAt ||
        student?.enteredAt ||
        student?.registeredAt ||
        0,
    ).getTime();

    const previousTrainingEndedAt = gameContext?.trainingEndedAt
      ? new Date(gameContext.trainingEndedAt).getTime()
      : 0;

    const joinedAfterTrainingEnded =
      Number.isFinite(joinedAt) &&
      joinedAt > 0 &&
      Number.isFinite(previousTrainingEndedAt) &&
      previousTrainingEndedAt > 0 &&
      joinedAt > previousTrainingEndedAt;

    if (studentTrainingState === "ENDED") {
      return "훈련 종료";
    }

    if (
      !studentTrainingState &&
      roomTrainingState === "ENDED" &&
      !joinedAfterTrainingEnded
    ) {
      return "훈련 종료";
    }

    if (student?.status && student.status !== "UNKNOWN") {
      if (student.status === "EVACUATING") return "대피 중";
      if (student.status === "EVACUATED") return "대피 완료";
      if (student.status === "RESTRICTED") return "제한됨";

      /*
       * 아직 훈련이 시작되지 않았는데 백엔드에서 일반 상태값을 보내는 경우에도
       * 학생 목록에서는 훈련 대기 상태를 우선 표시합니다.
       */
      if (
        studentTrainingState !== "RUNNING" &&
        roomTrainingState !== "RUNNING"
      ) {
        return "훈련 대기중";
      }

      return student.status;
    }

    if (studentTrainingState === "RUNNING" || roomTrainingState === "RUNNING") {
      return "훈련 진행중";
    }

    return "훈련 대기중";
  };

  const fetchStudents = useCallback(async () => {
    if (!classroomId) {
      setStudents([]);
      setStudentCount(0);
      return;
    }

    try {
      setStudentLoading(true);

      const res = await axios.get(
        `${API_BASE}/api/rooms/${classroomId}/students`,
        {
          headers: { ...authHeaders },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      console.log("students response:", res.data);

      if (!(res.status >= 200 && res.status < 300)) {
        showError("학생 목록 조회 실패", res);
        setStudents([]);
        setStudentCount(0);
        return;
      }

      const list = Array.isArray(res.data) ? res.data : [];

      const visibleList = list
        .filter((student) => !student.isKicked)
        .sort((a, b) => {
          const aTime = new Date(
            a.joinedAt || a.createdAt || a.enteredAt || a.registeredAt || 0,
          ).getTime();

          const bTime = new Date(
            b.joinedAt || b.createdAt || b.enteredAt || b.registeredAt || 0,
          ).getTime();

          return bTime - aTime;
        });

      setStudents(visibleList);
      setStudentCount(visibleList.length);
    } catch (err) {
      setStudents([]);
      setStudentCount(0);
      showError("학생 목록 조회 중 오류", err);
    } finally {
      setStudentLoading(false);
    }
  }, [classroomId, authHeaders]);

  // ✅ 페이지에 처음 들어오거나 다시 돌아왔을 때 학생 목록 자동 조회
  useEffect(() => {
    if (!classroomId) return;

    fetchStudents();
  }, [classroomId, fetchStudents]);

  const fetchGameStartContext = useCallback(async () => {
    if (!classroomId) {
      alert("classroomId 없음");
      return null;
    }

    try {
      const res = await axios.get(
        `${API_BASE}/api/rooms/${classroomId}/game-start-context`,
        {
          headers: { ...authHeaders },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      console.log("game-start-context classroomId =", classroomId);
      console.log("game-start-context 응답 =", res.status, res.data);

      if (!(res.status >= 200 && res.status < 300)) {
        showError("게임 시작 데이터 조회 실패", res);
        return null;
      }

      const data = res.data || {};
      saveGameContext(data);
      return data;
    } catch (err) {
      showError("게임 시작 데이터 조회 중 오류", err);
      return null;
    }
  }, [classroomId, authHeaders]);

  const handleReissueJoinCode = async () => {
    if (!classroomId) return alert("classroomId가 없습니다.");
    if (!userId) return alert("로그인 정보(userId)가 없습니다.");

    try {
      setLoading(true);

      const res = await axios.put(
        `${API_BASE}/api/rooms/${classroomId}/join-code`,
        null,
        {
          headers: { ...authHeaders },
          params: { userId },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      if (!(res.status >= 200 && res.status < 300)) {
        showError("입장 코드 재발급 실패", res);
        return;
      }

      const data = res.data || {};
      if (data.joinCode) setJoinCode(data.joinCode);
      if (data.className) setClassName(data.className);
      if (typeof data.studentCount === "number") {
        setStudentCount(data.studentCount);
      }

      alert("입장 코드가 재발급되었습니다.");
    } catch (err) {
      showError("입장 코드 재발급 중 오류", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoom = async () => {
    if (!classroomId) return alert("classroomId가 없습니다.");
    if (!userId) return alert("userId가 없습니다.");

    const nextName = editClassName.trim();
    const nextCount = Number(String(editStudentCount).replace(/[^0-9]/g, ""));

    if (!nextName) return alert("반 이름을 입력해 주세요.");

    const payload = {
      classroomId: String(classroomId),
      userId: String(userId),
      className: nextName,
      studentCount: Number.isFinite(nextCount) ? nextCount : 0,
    };

    try {
      setLoading(true);

      const res = await axios.patch(
        `${API_BASE}/api/rooms/${classroomId}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
            ...authHeaders,
          },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      if (!(res.status >= 200 && res.status < 300)) {
        showError("방 정보 수정 실패", res);
        return;
      }

      const data = res.data || {};
      setClassName(data.className ?? nextName);
      setStudentCount(
        typeof data.studentCount === "number"
          ? data.studentCount
          : payload.studentCount,
      );
      if (data.joinCode) setJoinCode(data.joinCode);

      setEditOpen(false);
      alert("방 정보가 수정되었습니다.");
    } catch (err) {
      showError("방 정보 수정 중 오류", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = () => {
    setEditClassName(className);
    setEditStudentCount(String(studentCount));
    setEditOpen(true);
  };

  const handleKickStudent = async (studentId) => {
    if (!classroomId) return alert("classroomId가 없습니다.");
    if (!studentId) return alert("studentId가 없습니다.");

    const ok = window.confirm("이 학생을 강퇴하시겠습니까?");
    if (!ok) return;

    try {
      setLoading(true);

      const res = await axios.delete(
        `${API_BASE}/api/rooms/${classroomId}/students/${studentId}`,
        {
          headers: { ...authHeaders },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      if (!(res.status >= 200 && res.status < 300)) {
        showError("학생 강퇴 실패", res);
        return;
      }

      const data = res.data || {};
      alert(data.message || "학생이 강퇴되었습니다.");

      setStudents((prev) => {
        const next = prev.filter((s) => s.studentId !== studentId);
        setStudentCount(next.length);
        return next;
      });
    } catch (err) {
      showError("학생 강퇴 중 오류", err);
    } finally {
      setLoading(false);
    }
  };

  // 활성 시나리오 서버 반영
  const setActiveScenarioToServer = async (scenarioId) => {
    if (!classroomId || !scenarioId) return false;

    const res = await axios.put(
      `${API_BASE}/api/rooms/${classroomId}/active-scenario`,
      { scenarioId },
      {
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          ...authHeaders,
        },
        timeout: 10000,
        validateStatus: () => true,
      },
    );

    if (!(res.status >= 200 && res.status < 300)) {
      showError("활성 시나리오 설정 실패", res);
      return false;
    }

    return true;
  };

  const validateTrainingStart = async () => {
    const errors = [];

    if (!classroomId) {
      errors.push("교실 정보가 없습니다.");
    }

    if (!students || students.length === 0) {
      errors.push(
        "입장한 학생이 없습니다. 학생이 최소 1명 이상 입장해야 합니다.",
      );
    }

    const context = await fetchGameStartContext();

    if (!context) {
      errors.push("게임 시작 정보를 불러오지 못했습니다.");
      return { ok: false, errors, context: null };
    }

    const scenarioId = context.scenarioId || context.activeScenarioId;
    const activeMapVersionId = context.activeMapVersionId;

    if (!scenarioId) {
      const assignmentRes = await axios.get(
        `${API_BASE}/api/scenario-assignments?scenarioId=${scenarioId}`,
        {
          headers: { ...authHeaders },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      if (assignmentRes.status >= 200 && assignmentRes.status < 300) {
        const assignments = Array.isArray(assignmentRes.data)
          ? assignmentRes.data
          : [];

        if (assignments.length === 0) {
          errors.push(
            "선택된 시나리오에 미션/역할 데이터가 없습니다. 시나리오 저장 또는 자동 미션 생성이 필요합니다.",
          );
        }
      }
      errors.push(
        "시작할 시나리오가 선택되지 않았습니다. 시나리오 관리에서 시나리오를 먼저 선택하세요.",
      );
    }

    if (!activeMapVersionId) {
      errors.push(
        "활성 구조도가 없습니다. 구조도 설정에서 맵 버전을 저장한 뒤 '활성 맵 적용'을 먼저 해주세요.",
      );
    }

    return {
      ok: errors.length === 0,
      errors,
      context,
    };
  };

  const prepareStudentTeamAssignment = async (scenarioId) => {
    if (!scenarioId) {
      alert("팀을 배정할 scenarioId가 없습니다.");
      return null;
    }

    const stored = getStoredGameContext();

    console.log("🔥 팀 배정 직전 gameContext =", stored);

    let distributePayload;

    try {
      distributePayload = buildTeamDistributePayload(stored);
    } catch (err) {
      alert(err.message);
      return null;
    }

    console.log("🔥 팀 정원 저장 요청 =", distributePayload);

    const distributeRes = await axios.post(
      `${API_BASE}/api/scenarios/${scenarioId}/teams/distribute`,
      distributePayload,
      {
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          ...authHeaders,
        },
        timeout: 10000,
        validateStatus: () => true,
      },
    );

    console.log(
      "🔥 팀 정원 저장 응답 =",
      distributeRes.status,
      distributeRes.data,
    );

    if (!(distributeRes.status >= 200 && distributeRes.status < 300)) {
      showError("팀별 정원 저장 실패", distributeRes);
      return null;
    }

    const assignRes = await axios.post(
      `${API_BASE}/api/scenarios/${scenarioId}/teams/assign-students`,
      {},
      {
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          ...authHeaders,
        },
        timeout: 10000,
        validateStatus: () => true,
      },
    );

    console.log(
      "🔥 학생 랜덤 팀 배정 응답 =",
      assignRes.status,
      assignRes.data,
    );

    if (!(assignRes.status >= 200 && assignRes.status < 300)) {
      showError("학생 랜덤 팀 배정 실패", assignRes);
      return null;
    }

    const assignmentResult = assignRes.data || {};
    const totalStudents = Number(assignmentResult.totalStudents || 0);

    if (totalStudents <= 0) {
      alert(
        "팀에 배정할 학생이 없습니다. 학생들이 입장 코드를 입력해 교실에 들어왔는지 확인하세요.",
      );

      return null;
    }

    const assignedCount = Array.isArray(assignmentResult.teams)
      ? assignmentResult.teams.reduce(
          (sum, team) => sum + Number(team.assignedCount || 0),
          0,
        )
      : 0;

    if (assignedCount !== totalStudents) {
      alert(
        `학생 팀 배정 인원이 맞지 않습니다.\n` +
          `전체 학생: ${totalStudents}명\n` +
          `배정 완료: ${assignedCount}명`,
      );

      return null;
    }

    saveGameContext({
      ...stored,
      lastTeamAssignmentResult: assignmentResult,
    });

    return assignmentResult;
  };

  const handleTrainingStart = async (contextData = null) => {
    if (!classroomId) {
      alert("classroomId 없음");
      return false;
    }

    // ✅ localStorage에 저장되어 있던 시나리오 정보
    const localContext = getStoredGameContext();

    // ✅ 서버 응답과 localStorage 정보를 합침
    // 서버 응답에 trainTime이 없어도 localStorage의 trainTime 유지
    const stored = {
      ...localContext,
      ...(contextData || {}),
    };

    console.log("🔥 trainingTimeSeconds =", stored?.trainingTimeSeconds);
    console.log("🔥 trainTime =", stored?.trainTime);
    console.log("🔥 trainingTime =", stored?.trainingTime);

    console.log(
      "🔥 trainingDurationMinutes =",
      stored?.trainingDurationMinutes,
    );

    console.log(
      "🔥 trainingDurationSeconds =",
      stored?.trainingDurationSeconds,
    );

    const scenarioId = stored?.scenarioId || stored?.activeScenarioId || null;

    const payload = {
      scenarioId,
    };

    try {
      const res = await axios.post(
        `${API_BASE}/api/rooms/${classroomId}/training/start`,
        payload,
        {
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
            ...authHeaders,
          },
          timeout: 10000,
          validateStatus: () => true,
        },
      );

      if (!(res.status >= 200 && res.status < 300)) {
        showError("훈련 시작 상태 저장 실패", res);
        return false;
      }

      const nextContext = {
        ...stored,
        classroomId: stored?.classroomId || String(classroomId),
        scenarioId: res.data?.scenarioId || stored?.scenarioId || scenarioId,
        trainingState: res.data?.trainingState || "RUNNING",
        trainingStartedAt: res.data?.trainingStartedAt || getIsoNow(),
        trainingEndedAt: res.data?.trainingEndedAt || null,
        activeScenarioId: res.data?.activeScenarioId || scenarioId,
      };

      autoEndRequestedRef.current = false;

      // ✅ 시나리오에서 설정한 시간을 초 단위로 변환
      // ✅ 훈련 정보를 저장하면 useEffect에서 타이머를 자동 계산함
      saveGameContext(nextContext);

      console.log("🔥 훈련 시작 context 저장 =", nextContext);

      return true;
    } catch (err) {
      showError("훈련 시작 상태 저장 중 오류", err);
      return false;
    }
  };

  const handleTrainingEnd = useCallback(
    async (isAutoEnd = false) => {
      if (!classroomId) {
        alert("classroomId 없음");
        return false;
      }

      const stored = getStoredGameContext();
      const scenarioId = stored?.scenarioId || stored?.activeScenarioId || null;
      const endedAt = getIsoNow();

      const payload = {
        classroomId: String(classroomId),
        trainingState: "ENDED",
        trainingStartedAt: stored?.trainingStartedAt || null,
        trainingEndedAt: endedAt,
        activeScenarioId: scenarioId,
      };

      try {
        setLoading(true);

        const res = await axios.post(
          `${API_BASE}/api/rooms/${classroomId}/training/end`,
          payload,
          {
            headers: {
              "Content-Type": "application/json; charset=UTF-8",
              ...authHeaders,
            },
            timeout: 10000,
            validateStatus: () => true,
          },
        );

        if (!(res.status >= 200 && res.status < 300)) {
          showError("훈련 종료 상태 저장 실패", res);
          return false;
        }

        const resultScenarioId =
          res.data?.activeScenarioId || res.data?.scenarioId || scenarioId;

        const nextContext = {
          ...stored,
          trainingState: res.data?.trainingState || "ENDED",
          trainingStartedAt:
            res.data?.trainingStartedAt || stored?.trainingStartedAt || null,
          trainingEndedAt: res.data?.trainingEndedAt || endedAt,
          activeScenarioId: resultScenarioId,
          scenarioId: resultScenarioId,
        };

        saveGameContext(nextContext);
        await fetchStudents();

        if (!resultScenarioId) {
          alert(
            "훈련은 종료되었지만 분석 결과를 불러올 시나리오 ID가 없습니다.",
          );
          return false;
        }

        localStorage.setItem(
          "lastResultContext",
          JSON.stringify({
            scenarioId: resultScenarioId,
            activeScenarioId: resultScenarioId,
            classroomId,
            joinCode,
            roomName: className,
            studentCount,
          }),
        );

        localStorage.setItem("activeScenarioId", String(resultScenarioId));
        setResultScenarioId(resultScenarioId);

        alert(
          isAutoEnd
            ? "시나리오에 지정된 시간이 지나 훈련이 자동으로 종료되었습니다.\n분석 결과 보기 버튼을 누르면 결과를 확인할 수 있습니다."
            : "훈련이 종료되었습니다.\n분석 결과 보기 버튼을 누르면 결과를 확인할 수 있습니다.",
        );

        return true;
      } catch (err) {
        showError("훈련 종료 상태 저장 중 오류", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [
      classroomId,
      authHeaders,
      fetchStudents,
      joinCode,
      className,
      studentCount,
    ],
  );

  useEffect(() => {
    if (!gameContext) {
      setRemainingSeconds(null);
      return;
    }

    // ✅ 훈련 중이 아니면 타이머 X
    if (gameContext.trainingState !== "RUNNING") {
      setRemainingSeconds(null);
      return;
    }

    const startedAtValue = gameContext.trainingStartedAt;
    const durationMs = getTrainingDurationMs(gameContext);

    if (!startedAtValue) {
      console.warn("⚠ trainingStartedAt이 없습니다.");
      setRemainingSeconds(null);
      return;
    }

    if (!durationMs) {
      console.warn("⚠ 훈련 시간을 찾을 수 없습니다.", gameContext);
      setRemainingSeconds(null);
      return;
    }

    // ✅ 서버 시간이 UTC인데 Z가 빠져 내려오는 경우 보정
    const normalizeServerDateTime = (value) => {
      if (!value) return null;

      let normalized = String(value);

      // Java의 LocalDateTime처럼 timezone 정보가 없는 경우 UTC로 처리
      const hasTimezone =
        normalized.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(normalized);

      if (!hasTimezone) {
        normalized += "Z";
      }

      return normalized;
    };

    const normalizedStartedAt = normalizeServerDateTime(startedAtValue);

    const startedAt = new Date(normalizedStartedAt).getTime();

    if (!Number.isFinite(startedAt)) {
      console.warn(
        "⚠ trainingStartedAt 형식이 올바르지 않습니다.",
        startedAtValue,
      );

      setRemainingSeconds(null);
      return;
    }

    // ✅ 실제 종료 예정 시각
    const endAt = startedAt + durationMs;

    console.log("🔥 훈련 타이머 복원", {
      startedAt: new Date(startedAt).toISOString(),
      endAt: new Date(endAt).toISOString(),
      durationMs,
    });

    const updateCountdown = () => {
      // ✅ 현재 시간 기준으로 남은 시간 재계산
      const remainingMs = endAt - Date.now();

      const seconds = Math.max(0, Math.ceil(remainingMs / 1000));

      setRemainingSeconds(seconds);

      // ✅ 시간 종료
      if (remainingMs <= 0) {
        if (!autoEndRequestedRef.current) {
          autoEndRequestedRef.current = true;

          console.log("🔥 훈련 시간 종료 → 자동 종료 API 호출");

          handleTrainingEnd(true).then((success) => {
            if (!success) {
              autoEndRequestedRef.current = false;
            }
          });
        }
      }
    };

    // ✅ 페이지에 들어온 즉시 남은 시간 계산
    updateCountdown();

    // ✅ 이후 1초마다 현재시간 기준으로 다시 계산
    const intervalId = window.setInterval(() => {
      updateCountdown();
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    gameContext?.trainingState,
    gameContext?.trainingStartedAt,
    gameContext?.trainingTimeSeconds,
    gameContext?.trainTime,
    gameContext?.trainingDurationSeconds,
    gameContext?.durationSeconds,
    gameContext?.timeLimitSeconds,
    handleTrainingEnd,
  ]);
  const handleGameStart = async () => {
    if (!classroomId) return alert("classroomId 없음");

    try {
      setLoading(true);

      const stored = getStoredGameContext();
      const scenarioId = stored?.scenarioId || stored?.activeScenarioId || null;

      if (!scenarioId) {
        alert(
          "시작할 시나리오가 선택되지 않았습니다. 시나리오 관리에서 시나리오를 먼저 선택하세요.",
        );
        return;
      }

      // 1. 활성 시나리오 설정
      const activeSet = await setActiveScenarioToServer(scenarioId);
      if (!activeSet) return;

      // 2. 구조도 및 학생 존재 여부 검사
      const validation = await validateTrainingStart();

      if (!validation.ok) {
        alert(
          "훈련을 시작할 수 없습니다.\n\n" +
            validation.errors.map((e, i) => `${i + 1}. ${e}`).join("\n"),
        );

        return;
      }

      // 3. 팀 정원 저장 + 학생 랜덤 역할 배정
      const assignmentResult = await prepareStudentTeamAssignment(scenarioId);

      if (!assignmentResult) return;

      // 4. 학생 배정 성공 후에만 훈련 시작
      const started = await handleTrainingStart(validation.context);
      if (!started) return;

      // ✅ 새 훈련 시작 직후 기존 화면 목록 제거
      setStudents([]);
      setStudentCount(0);

      // 5. 최신 게임 컨텍스트 다시 조회
      const context = await fetchGameStartContext();
      if (!context) return;

      // ✅ 현재 훈련 참가 학생 목록 다시 조회
      await fetchStudents();

      alert("훈련이 시작되었습니다.");
    } catch (err) {
      showError("게임 시작 실패", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!classroomId) return;

    localStorage.setItem(
      "roomContext",
      JSON.stringify({
        classroomId,
        joinCode,
        className,
        studentCount,
      }),
    );
  }, [classroomId, joinCode, className, studentCount]);

  return (
    <div className="bg-[#F9FBE7] min-h-screen">
      <Navbar />

      <div className="p-8">
        <h2 className="text-3xl font-bold text-[#2E7D32] mb-6">
          {className} 채널
        </h2>

        <div className="mb-6 bg-white rounded-2xl p-5 shadow border border-[#C8E6C9]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xl font-semibold text-[#2E7D32]">
                입장 코드:{" "}
                <span className="text-[#FBC02D] font-extrabold">
                  {joinCode}
                </span>
              </div>

              <div className="text-sm text-gray-700 mt-1">
                학생 수: {studentCount}명
              </div>

              {/* ✅ 훈련 중일 때만 카운트다운 표시 */}
              {gameContext?.trainingState === "RUNNING" && (
                <div className="mt-3">
                  <div className="text-sm text-gray-500">남은 훈련 시간</div>

                  <div
                    className={`text-3xl font-extrabold ${
                      remainingSeconds !== null && remainingSeconds <= 60
                        ? "text-red-500"
                        : "text-[#2E7D32]"
                    }`}
                  >
                    {formatRemainingTime(remainingSeconds)}
                  </div>
                </div>
              )}

              {!userId && (
                <div className="text-xs text-red-500 mt-1">
                  ⚠ userId가 없습니다. 재발급/수정이 실패할 수 있어요.
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleReissueJoinCode}
                disabled={loading || !classroomId || !userId}
                className="px-4 py-2 bg-[#66BB6A] text-white rounded-lg shadow hover:bg-[#2E7D32] disabled:opacity-60"
              >
                {loading ? "처리 중..." : "입장 코드 재발급"}
              </button>

              <button
                onClick={handleOpenEdit}
                disabled={loading || !classroomId || !userId}
                className="px-4 py-2 bg-[#90CAF9] text-white rounded-lg shadow hover:bg-[#42A5F5] disabled:opacity-60"
              >
                방 정보 수정
              </button>

              <button
                onClick={fetchStudents}
                disabled={studentLoading || loading || !classroomId}
                className="px-4 py-2 bg-[#26A69A] text-white rounded-lg shadow hover:bg-[#00897B] disabled:opacity-60"
              >
                {studentLoading ? "불러오는 중..." : "학생 새로고침"}
              </button>

              <button
                onClick={handleGameStart}
                disabled={loading || !classroomId || students.length === 0}
                className="px-4 py-2 bg-[#FBC02D] text-white font-bold rounded-lg shadow hover:bg-[#F9A825] disabled:opacity-60"
              >
                {loading ? "처리 중..." : "훈련 시작"}
              </button>

              <button
                onClick={handleTrainingEnd}
                disabled={loading || !classroomId}
                className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg shadow hover:bg-red-600 disabled:opacity-60"
              >
                훈련 종료
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-2xl font-bold text-[#2E7D32] mb-3">학생 목록</h3>

          <div className="mb-3 text-sm text-gray-600">
            학생이 입장 코드를 입력해 들어오면 이 목록에 자동으로 표시됩니다.
          </div>

          {studentLoading ? (
            <div className="bg-white rounded-xl p-4 shadow border border-[#C8E6C9] text-gray-600">
              학생 목록 불러오는 중...
            </div>
          ) : students.length === 0 ? (
            <div className="bg-white rounded-xl p-4 shadow border border-[#C8E6C9] text-gray-600">
              아직 입장한 학생이 없습니다.
            </div>
          ) : (
            <ul className="space-y-2">
              {students.map((student) => (
                <li
                  key={student.studentId}
                  className="flex items-center justify-between px-4 py-3 bg-white border-l-4 border-[#66BB6A] rounded-lg shadow"
                >
                  <div>
                    <div className="text-[#2E7D32] font-semibold">
                      {student.studentName || "이름 없음"}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      상태: {getStudentDisplayStatus(student)}
                    </div>
                  </div>

                  <button
                    onClick={() => handleKickStudent(student.studentId)}
                    className="px-3 py-1 bg-[#F44336] text-white text-sm rounded hover:bg-[#C62828]"
                  >
                    강퇴
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {editOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-5 text-center">방 정보 수정</h3>

            <label className="text-sm text-gray-600">반 이름</label>
            <input
              type="text"
              value={editClassName}
              onChange={(e) => setEditClassName(e.target.value)}
              className="w-full mb-4 mt-1 px-3 py-3 border border-green-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-300"
            />

            <label className="text-sm text-gray-600">학생 수</label>
            <input
              type="number"
              value={editStudentCount}
              onChange={(e) =>
                setEditStudentCount(e.target.value.replace(/[^0-9]/g, ""))
              }
              className="w-full mb-5 mt-1 px-3 py-3 border border-green-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-300"
            />

            <button
              onClick={handleUpdateRoom}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-3 rounded-2xl shadow"
            >
              {loading ? "저장 중..." : "저장"}
            </button>

            <button
              onClick={() => setEditOpen(false)}
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

export default SchoolChannel;
