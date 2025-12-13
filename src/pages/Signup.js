import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE =
  "https://disaster-ar-backend-a7bvfvd8f6bxbsfh.koreacentral-01.azurewebsites.net";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ 서버가 내려주는 응답 형태가 여러 가지일 수 있어서 성공 조건을 넓게 잡음
  const isSignupSuccess = (res) => {
    if (!res) return false;
    const data = res.data;

    // 1) 스펙대로 status: success 를 주는 경우
    if (res.status >= 200 && res.status < 300 && data?.status === "success")
      return true;

    // 2) 지금 너가 받은 것처럼 userId를 주는 경우
    if (res.status >= 200 && res.status < 300 && data?.userId) return true;

    // 3) 혹시 id로 주는 경우까지 대비
    if (res.status >= 200 && res.status < 300 && data?.id) return true;

    return false;
  };

  const handleSignup = async () => {
    if (!email || !password || !name || !school) {
      alert("❌ 모든 필드를 입력해 주세요.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${API_BASE}/api/auth/signup`,
        {
          email,
          password,
          name,
          schoolName: school,
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
          // ✅ 4xx/5xx도 response로 들어오게 해서 상세 메시지 처리 가능하게 함
          validateStatus: () => true,
        }
      );

      console.log("✅ SIGNUP RESPONSE:", res);

      // ✅ 성공 처리
      if (isSignupSuccess(res)) {
        alert("✅ 회원가입이 완료되었습니다. 로그인 해주세요.");
        navigate("/login");
        return;
      }

      // ❌ 실패 처리: 상태코드 기준으로 안내
      const status = res.status;
      const data = res.data;

      // 400/422 입력값 문제
      if (status === 400 || status === 422) {
        alert(
          `❌ 입력값 오류 (${status})\n\n` +
            (data?.message || data?.detail || JSON.stringify(data, null, 2))
        );
        return;
      }

      // 409 중복
      if (status === 409) {
        alert("❌ 이미 가입된 이메일입니다.");
        return;
      }

      // 500 서버 내부
      if (status === 500) {
        alert(
          "🔥 서버 내부 오류 (500)\n\n" +
            (typeof data === "string" ? data : JSON.stringify(data, null, 2))
        );
        return;
      }

      // 기타
      alert(
        `❌ 회원가입 실패 (${status})\n\n서버 응답:\n${
          typeof data === "string" ? data : JSON.stringify(data, null, 2)
        }`
      );
    } catch (err) {
      // 여기로 오는 경우는 보통 timeout/네트워크 끊김 같은 케이스
      console.error("❌ SIGNUP ERROR FULL:", err);

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
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
          회원가입
        </h2>

        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded-lg"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded-lg"
        />
        <input
          type="text"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded-lg"
        />
        <input
          type="text"
          placeholder="학교명"
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          className="w-full mb-6 px-3 py-2 border rounded-lg"
        />

        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-darkGreen text-white py-2 rounded-lg disabled:opacity-60"
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>
      </div>
    </div>
  );
}

export default Signup;
