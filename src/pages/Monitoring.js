import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export default function Monitoring() {
  const location = useLocation();
  // =========================
  // 기본 값
  // =========================

  const classroomId = useMemo(() => {
    return (
      localStorage.getItem("classroomId") ||
      localStorage.getItem("roomId") ||
      ""
    );
  }, []);

  const schoolId = useMemo(() => {
    return location.state?.schoolId || localStorage.getItem("schoolId") || "";
  }, [location.state]);

  useEffect(() => {
    const id = location.state?.schoolId;

    if (id) {
      localStorage.setItem("schoolId", id);
    }
  }, [location.state]);

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token");

    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  }, []);

  // =========================
  // 상태
  // =========================

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [monitoringData, setMonitoringData] = useState(null);

  const [allStudents, setAllStudents] = useState([]);

  // ✅ 실제 비콘 위치
  const [beacons, setBeacons] = useState([]);

  // ✅ 비콘 ↔ 구역 매핑
  const [beaconMappings, setBeaconMappings] = useState([]);

  // 학생별 전화 미션 상태
  const [callMissions, setCallMissions] = useState([]);
  const [judgingStudentId, setJudgingStudentId] = useState("");

  const [selectedFloorIndex, setSelectedFloorIndex] = useState(0);

  const [selectedMarker, setSelectedMarker] = useState(null);

  const [lastUpdatedAt, setLastUpdatedAt] = useState("");

  // =========================
  // fallback mock
  // =========================

  const MOCK_MONITORING_DATA = {
    classroomId: classroomId || "mock-room",
    mapVersionId: "mock-map",
    floors: [],
  };

  // =========================
  // 유틸
  // =========================

  const resolveImageUrl = useCallback((src) => {
    if (!src) return "";

    if (
      src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("blob:") ||
      src.startsWith("data:")
    ) {
      return src;
    }

    const path = src.startsWith("/") ? src : `/${src}`;

    return `${API_BASE_URL}${path}`;
  }, []);

  const formatTime = (value) => {
    if (!value) return "-";

    return value.replace("T", " ").slice(0, 19);
  };

  const getStudentDetectState = (student) => {
    if (student.isKicked) return "KICKED";

    if (student.beaconState) return student.beaconState;

    if (student.beaconId || student.lastSeenAt) return "DETECTED";

    return "LOST";
  };

  const getStudentStatusText = (student) => {
    const status = String(student?.status || "UNKNOWN")
      .trim()
      .toUpperCase();

    switch (status) {
      case "EVACUATING":
        return "대피 중";

      case "EVACUATED":
        return "대피 완료";

      case "RESTRICTED":
        return "제한구역";

      case "UNKNOWN":
      default:
        return "상태 미확인";
    }
  };

  const getStudentStatusClass = (student) => {
    const status = String(student?.status || "UNKNOWN")
      .trim()
      .toUpperCase();

    switch (status) {
      case "EVACUATED":
        return "bg-green-100 text-green-700";

      case "EVACUATING":
        return "bg-blue-100 text-blue-700";

      case "RESTRICTED":
        return "bg-red-100 text-red-700";

      case "UNKNOWN":
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getCallMissionByStudentId = useCallback(
    (studentId) => {
      return (
        callMissions.find(
          (mission) =>
            String(mission?.studentId || "") === String(studentId || ""),
        ) || null
      );
    },
    [callMissions],
  );

  const getCallMissionStatusText = (status) => {
    switch (
      String(status || "")
        .trim()
        .toUpperCase()
    ) {
      case "SCHEDULED":
        return "미션 대기";

      case "AVAILABLE":
        return "시작 가능";

      case "CALLING":
        return "통화 중";

      case "WAITING_TEACHER_REVIEW":
        return "교사 판정 대기";

      case "SUCCESS":
        return "성공";

      case "FAILED":
        return "실패";

      case "EXPIRED":
        return "만료";

      default:
        return "미션 없음";
    }
  };

  const getCallMissionStatusClass = (status) => {
    switch (
      String(status || "")
        .trim()
        .toUpperCase()
    ) {
      case "SUCCESS":
        return "bg-green-100 text-green-700";

      case "FAILED":
        return "bg-red-100 text-red-700";

      case "WAITING_TEACHER_REVIEW":
        return "bg-orange-100 text-orange-700";

      case "CALLING":
        return "bg-blue-100 text-blue-700";

      case "AVAILABLE":
        return "bg-yellow-100 text-yellow-700";

      case "SCHEDULED":
        return "bg-gray-100 text-gray-700";

      case "EXPIRED":
        return "bg-gray-200 text-gray-500";

      default:
        return "bg-gray-100 text-gray-500";
    }
  };

  const getSignalText = (rssi) => {
    if (rssi === null || rssi === undefined) {
      return "미감지";
    }

    if (rssi >= -60) {
      return "강함";
    }

    if (rssi >= -75) {
      return "양호";
    }

    return "약함";
  };

  const getMarkerZoneId = (marker) => {
    return marker?.zoneElementId || marker?.elementId || "";
  };

  const getMarkerKey = (marker) => {
    return (
      marker?.beaconId ||
      marker?.beaconElementId ||
      marker?.zoneElementId ||
      marker?.elementId ||
      ""
    );
  };

  // =========================
  // monitoring-map API
  // =========================

  const fetchMonitoringMap = useCallback(async () => {
    if (!classroomId) {
      throw new Error("classroomId가 없습니다.");
    }

    const response = await fetch(
      `${API_BASE_URL}/api/rooms/${classroomId}/monitoring-map`,
      {
        headers: {
          ...authHeaders,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`monitoring-map 실패 (${response.status})`);
    }

    return response.json();
  }, [classroomId, authHeaders]);

  // =========================
  // 실제 비콘 목록 API
  // =========================

  const fetchBeacons = useCallback(async () => {
    if (!schoolId) {
      console.warn("[Monitoring] schoolId가 없어 비콘 조회 생략");
      return [];
    }

    const response = await fetch(
      `${API_BASE_URL}/api/beacons?schoolId=${encodeURIComponent(schoolId)}`,
      {
        headers: {
          ...authHeaders,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`beacons 실패 (${response.status})`);
    }

    const data = await response.json();

    console.log("🔥 [Monitoring] 실제 비콘 목록 =", data);

    console.log("🔥 [Monitoring] 첫 번째 비콘 상세 =", data?.[0]);

    console.log(
      "🔥 [Monitoring] 첫 번째 비콘 JSON =",
      JSON.stringify(data?.[0], null, 2),
    );

    return Array.isArray(data) ? data : [];
  }, [schoolId, authHeaders]);

  // =========================
  // 비콘 ↔ 구역 매핑 API
  // =========================

  const fetchBeaconMappings = useCallback(
    async (floorIndex) => {
      if (!schoolId) return [];

      const response = await fetch(
        `${API_BASE_URL}/api/beacon-element-maps` +
          `?schoolId=${encodeURIComponent(schoolId)}` +
          `&floorIndex=${encodeURIComponent(floorIndex)}`,
        {
          headers: {
            ...authHeaders,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`beacon-element-maps 실패 (${response.status})`);
      }

      const data = await response.json();

      console.log("🔥 [Monitoring] 비콘-구역 매핑 =", data);

      return Array.isArray(data) ? data : [];
    },
    [schoolId, authHeaders],
  );

  // 여기에 추가
  const getActiveScenarioId = useCallback(() => {
    try {
      const gameContext = JSON.parse(
        localStorage.getItem("gameContext") || "{}",
      );

      return (
        gameContext?.scenarioId ||
        gameContext?.activeScenarioId ||
        localStorage.getItem("activeScenarioId") ||
        ""
      );
    } catch (err) {
      console.error("활성 시나리오 ID 조회 실패 =", err);
      return localStorage.getItem("activeScenarioId") || "";
    }
  }, []);

  // =========================
  // 학생 API
  // =========================

  const fetchStudents = useCallback(async () => {
    if (!classroomId) return [];

    const response = await fetch(
      `${API_BASE_URL}/api/rooms/${classroomId}/students`,
      {
        headers: {
          ...authHeaders,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`students 실패 (${response.status})`);
    }

    return response.json();
  }, [classroomId, authHeaders]);

  // =========================
  // 전화 미션 목록 API
  // =========================

  const fetchCallMissions = useCallback(async () => {
    const scenarioId = getActiveScenarioId();

    if (!scenarioId) {
      console.warn("전화 미션 조회: scenarioId가 없습니다.");
      return [];
    }

    const response = await fetch(
      `${API_BASE_URL}/api/scenarios/${scenarioId}/call-missions`,
      {
        headers: {
          ...authHeaders,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`call-missions 실패 (${response.status})`);
    }

    const data = await response.json();

    return Array.isArray(data?.missions) ? data.missions : [];
  }, [authHeaders, getActiveScenarioId]);

  // =========================
  // 구조도 API
  // =========================

  const fetchMapData = useCallback(async () => {
    if (!classroomId) return null;

    const response = await fetch(
      `${API_BASE_URL}/api/rooms/${classroomId}/map`,
      {
        headers: {
          ...authHeaders,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`map API 실패 (${response.status})`);
    }

    const mapData = await response.json();

    if (!mapData?.floorsJson) return null;

    const parsedFloors = JSON.parse(mapData.floorsJson);

    return {
      mapVersionId: mapData.mapVersionId,
      floors: parsedFloors,
    };
  }, [classroomId, authHeaders]);

  // =========================
  // 데이터 로드
  // =========================

  const fetchAllData = useCallback(async () => {
    try {
      // 주기적으로 갱신할 때 화면 전체 로딩 상태는 켜지 않음
      setError("");

      const [
        monitoringResult,
        studentsResult,
        mapResult,
        callMissionsResult,
        beaconsResult,
      ] = await Promise.allSettled([
        fetchMonitoringMap(),
        fetchStudents(),
        fetchMapData(),
        fetchCallMissions(),
        fetchBeacons(),
      ]);

      // =========================
      // monitoring-map
      // =========================

      let monitoring = MOCK_MONITORING_DATA;

      if (monitoringResult.status === "fulfilled") {
        monitoring = monitoringResult.value;
      } else {
        console.warn(
          "monitoring-map 실패 → fallback 사용",
          monitoringResult.reason,
        );
      }

      // =========================
      // 구조도 merge
      // =========================

      if (mapResult.status === "fulfilled" && mapResult.value) {
        const mapData = mapResult.value;

        const mergedFloors = (monitoring.floors || []).map((floor, index) => {
          const mapFloor =
            mapData.floors.find(
              (f) =>
                Number(f.floorIndex ?? index) ===
                Number(floor.floorIndex ?? index),
            ) || mapData.floors[index];

          return {
            ...floor,

            floorIndex:
              floor.floorIndex ??
              mapFloor?.floorIndex ??
              mapFloor?.floor ??
              index,

            floorLabel:
              floor.floorLabel ||
              mapFloor?.floorLabel ||
              mapFloor?.name ||
              `${index + 1}층`,

            elements:
              Array.isArray(mapFloor?.elements) && mapFloor.elements.length > 0
                ? mapFloor.elements
                : Array.isArray(floor.elements)
                  ? floor.elements
                  : [],

            image: {
              ...floor.image,

              src:
                mapFloor?.image?.src ||
                mapFloor?.imageSrc ||
                floor.image?.src ||
                null,

              naturalWidth:
                floor.image?.naturalWidth ||
                mapFloor?.image?.natural?.w ||
                mapFloor?.image?.naturalWidth ||
                1710,

              naturalHeight:
                floor.image?.naturalHeight ||
                mapFloor?.image?.natural?.h ||
                mapFloor?.image?.naturalHeight ||
                423,
            },
          };
        });

        monitoring = {
          ...monitoring,
          mapVersionId: monitoring.mapVersionId || mapData.mapVersionId,
          floors: mergedFloors,
        };
      }

      // =========================
      // 학생 목록
      // =========================

      let students = [];

      if (studentsResult.status === "fulfilled") {
        students = Array.isArray(studentsResult.value)
          ? studentsResult.value
          : [];
      } else {
        console.warn("학생 목록 조회 실패", studentsResult.reason);
      }

      // =========================
      // 전화 미션 목록
      // =========================

      let missions = [];

      if (callMissionsResult.status === "fulfilled") {
        missions = Array.isArray(callMissionsResult.value)
          ? callMissionsResult.value
          : [];
      } else {
        console.warn("전화 미션 목록 조회 실패", callMissionsResult.reason);
      }

      // =========================
      // 실제 비콘 목록
      // =========================

      if (beaconsResult.status === "fulfilled") {
        const beaconList = Array.isArray(beaconsResult.value)
          ? beaconsResult.value
          : [];

        setBeacons(beaconList);

        console.log("🔥 [Monitoring] 저장된 실제 비콘 =", beaconList);
      } else {
        console.warn("비콘 목록 조회 실패", beaconsResult.reason);

        setBeacons([]);
      }

      setMonitoringData(monitoring);
      setAllStudents(students);
      setCallMissions(missions);
      setLastUpdatedAt(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("[Monitoring] 전체 데이터 조회 오류:", err);

      setError(
        err?.message || "모니터링 데이터를 불러오는 중 오류가 발생했습니다.",
      );
    }
  }, [
    fetchMonitoringMap,
    fetchStudents,
    fetchMapData,
    fetchCallMissions,
    fetchBeacons,
  ]);

  const handleJudgeCallMission = async (studentId, success) => {
    const scenarioId = getActiveScenarioId();

    if (!scenarioId) {
      alert("현재 활성 시나리오 ID가 없습니다.");
      return;
    }

    if (!studentId) {
      alert("학생 ID가 없습니다.");
      return;
    }

    const resultText = success ? "성공" : "실패";

    const confirmed = window.confirm(
      `이 학생의 전화 미션을 ${resultText} 처리하시겠습니까?`,
    );

    if (!confirmed) return;

    try {
      setJudgingStudentId(studentId);

      const response = await fetch(
        `${API_BASE_URL}/api/scenarios/${scenarioId}` +
          `/students/${studentId}/call-mission/judge`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
            ...authHeaders,
          },
          body: JSON.stringify({
            success,
            memo: success ? "신고 내용을 정확히 전달함" : "신고 내용이 부족함",
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || `전화 미션 판정 실패 (${response.status})`,
        );
      }

      alert(`전화 미션을 ${resultText} 처리했습니다.`);

      await fetchAllData();
    } catch (err) {
      console.error("전화 미션 판정 오류 =", err);

      alert(err?.message || "전화 미션 판정 중 오류가 발생했습니다.");
    } finally {
      setJudgingStudentId("");
    }
  };

  // =========================
  // 초기 로드
  // =========================

  useEffect(() => {
    const init = async () => {
      await fetchAllData();

      setLoading(false);
    };

    init();

    const timer = setInterval(() => {
      fetchAllData();
    }, 3000);

    return () => clearInterval(timer);
  }, [fetchAllData]);

  // =========================
  // floor
  // =========================

  const floors = useMemo(() => {
    const rawFloors = monitoringData?.floors || [];

    return rawFloors.filter((floor, index, self) => {
      const label = floor.floorLabel || floor.name || `${index + 1}층`;

      return (
        index ===
        self.findIndex((f) => {
          const compareLabel = f.floorLabel || f.name;

          return compareLabel === label;
        })
      );
    });
  }, [monitoringData]);

  const selectedFloor = useMemo(() => {
    if (!floors.length) return null;

    return floors[selectedFloorIndex] || floors[0];
  }, [floors, selectedFloorIndex]);

  // =========================
  // 현재 층 비콘 ↔ 구역 매핑 조회
  // =========================

  useEffect(() => {
    if (!selectedFloor) {
      setBeaconMappings([]);
      return;
    }

    const floorIndex = Number(selectedFloor.floorIndex ?? selectedFloorIndex);

    const loadMappings = async () => {
      try {
        const data = await fetchBeaconMappings(floorIndex);

        setBeaconMappings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("[Monitoring] 비콘-구역 매핑 조회 실패 =", err);

        setBeaconMappings([]);
      }
    };

    loadMappings();
  }, [selectedFloor, selectedFloorIndex, fetchBeaconMappings]);

  // =========================
  // image
  // =========================

  const imageUrl = useMemo(() => {
    const src = selectedFloor?.image?.src || selectedFloor?.imageSrc || "";

    return resolveImageUrl(src);
  }, [selectedFloor, resolveImageUrl]);

  const imageNaturalSize = useMemo(() => {
    const image = selectedFloor?.image || {};

    const width =
      Number(image.naturalWidth) ||
      Number(image.width) ||
      Number(image.natural?.w) ||
      Number(selectedFloor?.naturalWidth) ||
      1710;

    const height =
      Number(image.naturalHeight) ||
      Number(image.height) ||
      Number(image.natural?.h) ||
      Number(selectedFloor?.naturalHeight) ||
      423;

    return {
      width,
      height,
    };
  }, [selectedFloor]);

  const toPercentX = useCallback(
    (x) => `${(Number(x || 0) / imageNaturalSize.width) * 100}%`,
    [imageNaturalSize.width],
  );

  const toPercentY = useCallback(
    (y) => `${(Number(y || 0) / imageNaturalSize.height) * 100}%`,
    [imageNaturalSize.height],
  );

  const toPercentWidth = useCallback(
    (width) => `${(Number(width || 0) / imageNaturalSize.width) * 100}%`,
    [imageNaturalSize.width],
  );

  const toPercentHeight = useCallback(
    (height) => `${(Number(height || 0) / imageNaturalSize.height) * 100}%`,
    [imageNaturalSize.height],
  );

  // =========================
  // marker
  // =========================

  // monitoring-map은 학생 감지 정보용
  const monitoringMarkers = Array.isArray(selectedFloor?.beaconMarkers)
    ? selectedFloor.beaconMarkers
    : [];

  // 현재 서버 층 번호
  const currentFloorNumber = Number(
    selectedFloor?.floorIndex ?? selectedFloorIndex,
  );

  console.log("🔥 현재 구조도 층 =", {
    selectedFloorIndex,
    selectedFloorFloorIndex: selectedFloor?.floorIndex,
    currentFloorNumber,
  });

  console.log(
    "🔥 /api/beacons 층 정보 =",
    beacons.map((b) => ({
      beaconNo: b.beaconNo,
      beaconId: b.beaconId,
      floorIndex: b.floorIndex,
      x: b.x,
      y: b.y,
    })),
  );

  console.log("🔥 beaconMappings =", beaconMappings);

  const markers = useMemo(() => {
    const result = beacons
      .filter((beacon) => {
        return Number(beacon.floorIndex) === Number(currentFloorNumber);
      })
      .map((beacon) => {
        const beaconId = String(beacon?.beaconId || "");

        // ✅ 학생 감지 정보
        const monitoringMarker = monitoringMarkers.find(
          (marker) => String(marker?.beaconId || "") === beaconId,
        );

        // ✅ 백엔드가 자동 갱신한 방/구역 매핑
        const mapping = beaconMappings.find(
          (item) => String(item?.beaconId || "") === beaconId,
        );

        return {
          // =========================
          // 실제 비콘
          // =========================
          beaconId: beacon.beaconId,
          beaconNo: beacon.beaconNo,

          uuid: beacon.uuid,
          major: beacon.major,
          minor: beacon.minor,
          name: beacon.name,

          floorIndex: Number(beacon.floorIndex),

          // ★ 위치는 무조건 /api/beacons
          x: Number(beacon.x),
          y: Number(beacon.y),

          // =========================
          // 방 / 구역 매핑
          // =========================
          elementId: mapping?.elementId ?? monitoringMarker?.elementId ?? null,

          zoneElementId:
            mapping?.zoneElementId ??
            mapping?.elementId ??
            monitoringMarker?.zoneElementId ??
            monitoringMarker?.elementId ??
            null,

          placementName:
            mapping?.placementName ?? monitoringMarker?.placementName ?? "",

          zoneType: mapping?.zoneType ?? monitoringMarker?.zoneType ?? null,

          thresholdRssi:
            mapping?.thresholdRssi ?? monitoringMarker?.thresholdRssi ?? -85,

          isActive: mapping?.isActive ?? monitoringMarker?.isActive ?? true,

          // =========================
          // 학생 감지
          // =========================
          studentCount: monitoringMarker?.studentCount ?? 0,

          students: monitoringMarker?.students ?? [],
        };
      })
      .filter((marker) => marker.isActive !== false);

    console.log("🔥🔥🔥 [Monitoring] 최종 markers =", result);

    return result;
  }, [beacons, beaconMappings, monitoringMarkers, currentFloorNumber]);
  // ✅ monitoring-map이 갱신되면 선택 중인 비콘 상세 정보도 최신 값으로 교체
  useEffect(() => {
    setSelectedMarker((prev) => {
      if (!prev) return null;

      const prevKey = getMarkerKey(prev);

      const latestMarker = markers.find(
        (marker) => getMarkerKey(marker) === prevKey,
      );

      return latestMarker || null;
    });
  }, [markers]);

  // 구조도에 저장된 실제 비콘 설치 위치
  const getMarkerPosition = (marker) => {
    if (
      marker?.x === null ||
      marker?.x === undefined ||
      marker?.y === null ||
      marker?.y === undefined
    ) {
      console.warn("[Monitoring] 실제 비콘 좌표 없음 =", marker);

      return null;
    }

    const x = Number(marker.x);
    const y = Number(marker.y);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      console.warn("[Monitoring] 잘못된 실제 비콘 좌표 =", marker);

      return null;
    }

    return {
      x,
      y,
    };
  };

  const getStudentLocationName = useCallback(
    (student) => {
      if (!student) return "미감지";

      const studentBeaconId = String(student.beaconId || "");
      const studentId = String(student.studentId || "");

      // 전체 층을 순회하면서 학생이 감지된 비콘 찾기
      for (const floor of floors) {
        const floorMarkers = Array.isArray(floor?.beaconMarkers)
          ? floor.beaconMarkers
          : [];

        const matchedMarker = floorMarkers.find((marker) => {
          const markerBeaconId = String(marker?.beaconId || "");

          const matchedByBeaconId =
            studentBeaconId &&
            markerBeaconId &&
            studentBeaconId === markerBeaconId;

          const matchedByStudentId = Array.isArray(marker?.students)
            ? marker.students.some(
                (item) => String(item?.studentId || "") === studentId,
              )
            : false;

          return matchedByBeaconId || matchedByStudentId;
        });

        if (!matchedMarker) continue;

        const zoneId = matchedMarker.zoneElementId || matchedMarker.elementId;

        const matchedZone = (floor?.elements || []).find(
          (element) => String(element?.id || "") === String(zoneId || ""),
        );

        if (matchedZone?.name) {
          return matchedZone.name;
        }

        if (matchedMarker?.placementName) {
          return matchedMarker.placementName;
        }

        return "매핑 갱신 필요";
      }

      return "미감지";
    },
    [floors],
  );

  // =========================
  // zone
  // =========================

  const normalizeZoneType = (type) => {
    const raw = String(type ?? "").trim();
    const compact = raw.replace(/\s+/g, "");
    const upper = raw.toUpperCase();

    if (
      upper === "FIRE_ZONE" ||
      upper === "DANGER_ZONE" ||
      upper === "DISASTER_ZONE" ||
      compact === "재난구역" ||
      compact === "화재구역"
    ) {
      return "FIRE_ZONE";
    }

    if (
      upper === "SAFE_ZONE" ||
      compact === "안전구역" ||
      compact === "대피구역"
    ) {
      return "SAFE_ZONE";
    }

    if (
      upper === "RESTRICTED_ZONE" ||
      compact === "제한구역" ||
      compact === "출입제한"
    ) {
      return "RESTRICTED_ZONE";
    }

    return "";
  };

  const zoneElements = (selectedFloor?.elements || []).filter((e) =>
    ["FIRE_ZONE", "SAFE_ZONE", "RESTRICTED_ZONE"].includes(
      normalizeZoneType(e.zoneType || e.elementType || e.type),
    ),
  );

  // =========================
  // stats
  // =========================

  // 퇴출된 학생인지 확인
  const isKickedStudent = useCallback((student) => {
    if (!student) return false;

    const status = String(student.status || "")
      .trim()
      .toUpperCase();
    const beaconState = String(student.beaconState || "")
      .trim()
      .toUpperCase();

    return (
      student.isKicked === true ||
      status === "KICKED" ||
      beaconState === "KICKED"
    );
  }, []);

  // 화면에 표시할 학생: 퇴출 학생 제외
  const visibleStudents = useMemo(() => {
    return allStudents.filter((student) => !isKickedStudent(student));
  }, [allStudents, isKickedStudent]);

  const totalStudentCount = visibleStudents.length;

  const dangerCount = visibleStudents.filter((student) =>
    ["RESTRICTED"].includes(String(student.status || "").toUpperCase()),
  ).length;

  // =========================
  // unity url
  // =========================

  const unityUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (monitoringData?.classroomId) {
      params.set("classroomId", monitoringData.classroomId);
    }

    if (monitoringData?.mapVersionId) {
      params.set("activeMapVersionId", monitoringData.mapVersionId);
    }

    if (selectedFloor?.floorIndex !== undefined) {
      params.set("floorIndex", selectedFloor.floorIndex);
    }

    return `/WebGL/index.html?${params.toString()}`;
  }, [monitoringData, selectedFloor]);

  const findZoneElementByMarker = (marker) => {
    const zoneId = marker?.zoneElementId || marker?.elementId;

    if (!zoneId) return null;

    return (selectedFloor?.elements || []).find((el) => {
      return String(el.id) === String(zoneId);
    });
  };

  const getMarkerDisplayName = (marker) => {
    const zoneElement = findZoneElementByMarker(marker);

    if (zoneElement?.name) {
      return zoneElement.name;
    }

    if (marker?.placementName) {
      return marker.placementName;
    }

    return "매핑 갱신 필요";
  };

  // =========================
  // marker click
  // =========================

  const handleSelectMarker = (marker) => {
    const zoneId = getMarkerZoneId(marker);

    // 2D 구조도에 표시된 실제 비콘 위치
    const beaconPosition = getMarkerPosition(marker);

    // 비콘과 연결된 구역은 이름, 구역 종류 표시용으로만 사용
    const zoneElement = findZoneElementByMarker(marker);

    console.log("[Monitoring] 선택 비콘 =", marker);
    console.log("[Monitoring] 연결 구역 ID =", zoneId);
    console.log("[Monitoring] 연결 구역 =", zoneElement);
    console.log("[Monitoring] 실제 비콘 좌표 =", beaconPosition);

    setSelectedMarker(marker);

    const iframe = document.getElementById("unity-monitoring-frame");

    iframe?.contentWindow?.postMessage(
      {
        type: "SELECT_BEACON_ZONE",

        payload: {
          elementId: zoneId,
          zoneElementId: zoneId,
          beaconElementId: marker.beaconElementId || null,
          beaconId: marker.beaconId,

          placementName:
            zoneElement?.name || marker.placementName || "선택 비콘",

          // 실제 비콘 위치로 이동
          x: beaconPosition.x,
          y: beaconPosition.y,
          width: 0,
          height: 0,

          beaconX: beaconPosition.x,
          beaconY: beaconPosition.y,

          studentCount: marker.studentCount ?? 0,
          students: marker.students || [],

          thresholdRssi: marker.thresholdRssi,

          zoneType: normalizeZoneType(
            marker.zoneType ||
              zoneElement?.zoneType ||
              zoneElement?.elementType ||
              zoneElement?.type,
          ),
        },
      },
      "*",
    );
  };

  // =========================
  // loading
  // =========================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa]">
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
          모니터링 데이터 불러오는 중...
        </div>
      </div>
    );
  }

  // =========================
  // render
  // =========================

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#F9FBE7]">
      <Navbar />

      <div className="flex-1 overflow-auto px-8 pb-8 pt-3 bg-[#F9FBE7] space-y-5">
        {/* header */}

        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#2E7D32] mb-2">
              실시간 통합 모니터링
            </h2>

            <p className="text-sm text-gray-600">
              마지막 갱신 :{lastUpdatedAt}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAllData}
            className="rounded-xl bg-[#66BB6A] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#2E7D32]"
          >
            새로고침
          </button>
        </div>

        {/* error */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* summary */}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[#C8E6C9] bg-white p-5 shadow-md">
            <p className="text-sm text-gray-500">전체 학생 수</p>

            <p className="mt-2 text-4xl font-bold text-[#2E7D32]">
              {totalStudentCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#C8E6C9] bg-white p-5 shadow-md">
            <p className="text-sm text-gray-500">위험 구역 학생 수</p>

            <p className="mt-2 text-4xl font-bold text-[#C62828]">
              {dangerCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#C8E6C9] bg-white p-5 shadow-md">
            <p className="text-sm text-gray-500">현재 층 활성 비콘 수</p>

            <p className="mt-2 text-4xl font-bold text-[#1976D2]">
              {markers.length}
            </p>
          </div>
        </section>

        {/* floor tabs */}

        <div className="flex flex-wrap gap-2">
          {floors.map((floor, index) => {
            const isActive = index === selectedFloorIndex;

            return (
              <button
                key={floor.floorIndex ?? index}
                type="button"
                onClick={() => {
                  setSelectedFloorIndex(index);
                  setSelectedMarker(null);
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium border transition ${
                  isActive
                    ? "bg-[#66BB6A] text-white border-[#66BB6A] shadow-sm"
                    : "bg-white text-[#2E7D32] border-[#A5D6A7] hover:bg-[#F1F8E9]"
                }`}
              >
                {floor.floorLabel || floor.name || `${index + 1}층`}
              </button>
            );
          })}
        </div>

        {/* main */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* 2D */}

          <section className="rounded-2xl border border-[#C8E6C9] bg-white p-6 shadow-md">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-[#2E7D32]">
                2D 구조도 모니터링
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                비콘 클릭 시 학생 상세 정보 확인 가능
              </p>
            </div>

            <div className="w-full overflow-auto rounded-lg border border-gray-200 bg-[#F1F8E9]">
              <div
                className="relative mx-auto"
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  aspectRatio: `${imageNaturalSize.width} / ${imageNaturalSize.height}`,
                }}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="구조도"
                    className="absolute inset-0 h-full w-full select-none"
                    style={{
                      objectFit: "fill",
                    }}
                    draggable={false}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    구조도 이미지 없음
                  </div>
                )}

                {zoneElements.map((element) => {
                  const zoneType = normalizeZoneType(
                    element.zoneType || element.elementType || element.type,
                  );

                  const left = toPercentX(element.x);
                  const top = toPercentY(element.y);
                  const width = toPercentWidth(element.width);
                  const height = toPercentHeight(element.height);

                  return (
                    <div
                      key={element.id}
                      className={`absolute rounded-lg border-2 ${
                        zoneType === "SAFE_ZONE"
                          ? "border-green-600 bg-green-500/20"
                          : ""
                      } ${
                        zoneType === "FIRE_ZONE"
                          ? "border-red-600 bg-red-500/20"
                          : ""
                      } ${
                        zoneType === "RESTRICTED_ZONE"
                          ? "border-yellow-500 bg-yellow-400/20"
                          : ""
                      }`}
                      style={{
                        left,
                        top,
                        width,
                        height,
                      }}
                      title={`${zoneType} / ${element.name || element.id}`}
                    />
                  );
                })}

                {/* markers */}
                {/* markers */}
                {markers.map((marker) => {
                  const position = getMarkerPosition(marker);

                  if (!position) {
                    return null;
                  }

                  const left = toPercentX(position.x);
                  const top = toPercentY(position.y);

                  const markerZoneId = getMarkerZoneId(marker);
                  const markerKey = getMarkerKey(marker);
                  const selectedMarkerKey = getMarkerKey(selectedMarker);

                  const selected = selectedMarkerKey === markerKey;

                  return (
                    <button
                      key={markerKey}
                      type="button"
                      onClick={() => handleSelectMarker(marker)}
                      className={`absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-sm font-bold text-white shadow-lg transition ${
                        selected
                          ? "bg-green-600 ring-4 ring-green-200"
                          : "bg-blue-500 hover:brightness-110"
                      }`}
                      style={{
                        left,
                        top,
                      }}
                      title={`${getMarkerDisplayName(marker)} / 감지 학생 ${
                        marker.studentCount ?? 0
                      }명`}
                    >
                      {marker.studentCount ?? 0}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* selected students */}

            <div className="mt-4 rounded-2xl border border-[#DCEDC8] bg-[#F1F8E9] p-4">
              {!selectedMarker ? (
                <p className="text-sm text-gray-500">비콘을 선택하세요.</p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="font-bold text-gray-800">
                      {getMarkerDisplayName(selectedMarker)}
                    </p>

                    <p className="text-sm text-gray-500">
                      {selectedMarker.zoneType || "일반 비콘"}
                    </p>

                    <p className="text-xs text-gray-500">
                      현재 감지 학생: {selectedMarker.studentCount ?? 0}명
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(selectedMarker.students || [])
                      .filter((student) => !isKickedStudent(student))
                      .map((student) => {
                        const state = getStudentDetectState(student);

                        return (
                          <div
                            key={student.studentId}
                            className="rounded-xl border border-[#C8E6C9] bg-white p-4 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {student.studentName}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                  신호 :{getSignalText(student.lastRssi)}
                                </p>

                                <p className="text-xs text-gray-500">
                                  마지막 감지 :{formatTime(student.lastSeenAt)}
                                </p>
                              </div>

                              <span
                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                  state === "DETECTED"
                                    ? "bg-[#E8F5E9] text-[#2E7D32]"
                                    : state === "LOST"
                                      ? "bg-[#FFEBEE] text-[#C62828]"
                                      : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {state}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 3D */}

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-[#2E7D32]">
                3D 메타버스 모니터링
              </h3>
            </div>

            <div className="h-[420px] overflow-hidden rounded-lg border border-gray-200 bg-[#F1F8E9]">
              <iframe
                key={selectedFloor?.floorIndex}
                id="unity-monitoring-frame"
                src={unityUrl}
                width="100%"
                height="100%"
                title="Unity WebGL Monitoring"
                className="h-full w-full border-0"
              />
            </div>
          </section>
        </div>

        {/* 전체 학생 */}

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#2E7D32]">전체 학생 현황</h3>

            <span className="text-sm text-gray-500">
              총 {visibleStudents.length}명
            </span>
          </div>

          <div className="overflow-auto rounded-2xl border border-[#C8E6C9]">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F1F8E9]">
                <tr>
                  <th className="border-b px-4 py-3 text-left font-semibold text-gray-700">
                    학생명
                  </th>

                  <th className="border-b px-4 py-3 text-left font-semibold text-gray-700">
                    상태
                  </th>

                  <th className="border-b px-4 py-3 text-left font-semibold text-gray-700">
                    위치
                  </th>

                  <th className="border-b px-4 py-3 text-left font-semibold text-gray-700">
                    신호
                  </th>

                  <th className="border-b px-4 py-3 text-left font-semibold text-gray-700">
                    마지막 감지
                  </th>
                  <th className="border-b px-4 py-3 text-left font-semibold text-gray-700">
                    전화 미션
                  </th>

                  <th className="border-b px-4 py-3 text-center font-semibold text-gray-700">
                    전화 미션 판정
                  </th>
                </tr>
              </thead>

              <tbody>
                {visibleStudents.map((student) => {
                  const callMission = getCallMissionByStudentId(
                    student.studentId,
                  );

                  const callMissionStatus = String(
                    callMission?.status || "",
                  ).toUpperCase();

                  const canJudge =
                    callMissionStatus === "WAITING_TEACHER_REVIEW";

                  const isJudging = judgingStudentId === student.studentId;

                  return (
                    <tr key={student.studentId}>
                      {/* 학생명 */}
                      <td className="border-b px-4 py-3 text-gray-700">
                        {student.studentName || "이름 없음"}
                      </td>

                      {/* 상태 */}
                      <td className="border-b px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${getStudentStatusClass(
                            student,
                          )}`}
                        >
                          {getStudentStatusText(student)}
                        </span>
                      </td>

                      {/* 위치 */}
                      <td className="border-b px-4 py-3 text-gray-700">
                        {getStudentLocationName(student)}
                      </td>

                      {/* 신호 */}
                      <td className="border-b px-4 py-3 text-gray-700">
                        {getSignalText(student.lastRssi)}
                      </td>

                      {/* 마지막 감지 */}
                      <td className="border-b px-4 py-3 text-gray-700">
                        {formatTime(student.lastSeenAt)}
                      </td>
                      {/* 전화 미션 상태 */}
                      <td className="border-b px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${getCallMissionStatusClass(
                            callMissionStatus,
                          )}`}
                        >
                          {getCallMissionStatusText(callMissionStatus)}
                        </span>

                        {callMission?.remainingSeconds > 0 && (
                          <p className="mt-1 text-xs text-gray-500">
                            {callMission.remainingSeconds}초 후 시작 가능
                          </p>
                        )}
                      </td>

                      {/* 전화 미션 판정 */}
                      <td className="border-b px-4 py-3">
                        <div className="flex justify-center gap-2">
                          {callMissionStatus === "SUCCESS" ? (
                            // 성공 판정 후에는 성공 버튼만 표시
                            <button
                              type="button"
                              disabled
                              className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white cursor-default"
                            >
                              성공
                            </button>
                          ) : callMissionStatus === "FAILED" ? (
                            // 실패 판정 후에는 실패 버튼만 표시
                            <button
                              type="button"
                              disabled
                              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white cursor-default"
                            >
                              실패
                            </button>
                          ) : (
                            // 아직 판정하지 않은 경우 성공/실패 버튼 모두 표시
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handleJudgeCallMission(
                                    student.studentId,
                                    true,
                                  )
                                }
                                disabled={!canJudge || isJudging}
                                className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {isJudging ? "처리 중..." : "성공"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleJudgeCallMission(
                                    student.studentId,
                                    false,
                                  )
                                }
                                disabled={!canJudge || isJudging}
                                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {isJudging ? "처리 중..." : "실패"}
                              </button>
                            </>
                          )}
                        </div>

                        {callMissionStatus === "CALLING" && (
                          <p className="mt-1 text-center text-xs text-gray-500">
                            학생 통화 완료 대기
                          </p>
                        )}

                        {(callMissionStatus === "SUCCESS" ||
                          callMissionStatus === "FAILED") && (
                          <p className="mt-1 text-center text-xs text-gray-500">
                            판정 완료
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
