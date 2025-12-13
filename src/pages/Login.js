import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE =
  "https://disaster-ar-backend-a7bvfvd8f6bxbsfh.koreacentral-01.azurewebsites.net";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ 로그인 성공 판정(서버 응답 형태가 달라도 최대한 커버)
  const isLoginSuccess = (res) => {
    if (!res) return false;
    const data = res.data;

    // 1) { status: "success", token, user } 형태
    if (res.status >= 200 && res.status < 300 && data?.status === "success")
      return true;

    // 2) { token: "...", user: {...} } 형태
    if (res.status >= 200 && res.status < 300 && data?.token) return true;

    // 3) 토큰은 없고 userId/user만 주는 형태(세션 로그인/단순 로그인일 수도)
    if (res.status >= 200 && res.status < 300 && (data?.userId || data?.user))
      return true;

    return false;
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${API_BASE}/api/auth/login`,
        { email, password },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
          // ✅ 4xx/5xx도 res로 받아서 status별 처리
          validateStatus: () => true,
        }
      );

      console.log("✅ LOGIN RESPONSE:", res);

      const data = res.data;

      // ✅ 성공 처리
      if (isLoginSuccess(res)) {
        // 토큰이 있으면 저장
        if (data?.token) localStorage.setItem("token", data.token);

        // user 정보가 있으면 저장 (없어도 문제 없음)
        if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));
        else {
          // user 객체가 없고 userId 같은 것만 오는 경우 대비
          const minimalUser =
            data?.userId || data?.email || data?.name
              ? { userId: data?.userId, email: data?.email, name: data?.name }
              : null;
          if (minimalUser) {
            localStorage.setItem("user", JSON.stringify(minimalUser));
          }
        }

        navigate("/main");
        return;
      }

      // ❌ 실패 처리: status code 기반
      const status = res.status;

      if (status === 400 || status === 422) {
        alert(
          `❌ 입력값 오류 (${status})\n\n` +
            (data?.message || data?.detail || JSON.stringify(data, null, 2))
        );
        return;
      }

      if (status === 401) {
        alert("❌ 이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }

      if (status === 403) {
        alert("❌ 접근이 거부되었습니다. 권한이 없습니다.");
        return;
      }

      if (status === 404) {
        alert("❌ 로그인 API 경로가 존재하지 않습니다. (/api/auth/login 확인)");
        return;
      }

      if (status === 500) {
        alert(
          "🔥 서버 내부 오류 (500)\n\n" +
            (typeof data === "string" ? data : JSON.stringify(data, null, 2))
        );
        return;
      }

      alert(
        `❌ 로그인 실패 (${status})\n\n서버 응답:\n${
          typeof data === "string" ? data : JSON.stringify(data, null, 2)
        }`
      );
    } catch (err) {
      // 여기로 오는 경우는 timeout/네트워크/브라우저 차단 같은 케이스
      console.error("❌ LOGIN ERROR FULL:", err);

      if (err.code === "ECONNABORTED") {
        alert("⏱️ 요청 시간이 초과되었습니다. (timeout)");
        return;
      }

      if (err.request) {
        alert(
          "🌐 서버로부터 응답이 없습니다.\n\n서버가 다운되었거나 네트워크 문제가 있습니다."
        );
        return;
      }

      alert("⚠️ 클라이언트 오류\n\n" + (err.message || "알 수 없는 오류"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg border border-lightGreen shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-center text-darkGreen">
          로그인
        </h2>

        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-lightGreen rounded-lg focus:outline-none focus:ring-2 focus:ring-lightGreen"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-lightGreen rounded-lg focus:outline-none focus:ring-2 focus:ring-lightGreen"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-lightGreen hover:bg-midGreen disabled:opacity-60 text-white font-bold py-2 rounded-lg mb-2"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>

        <button
          onClick={() => navigate("/signup")}
          className="w-full bg-darkGreen hover:bg-midGreen text-white font-bold py-2 rounded-lg"
        >
          회원가입
        </button>
      </div>
    </div>
  );
}

export default Login;
