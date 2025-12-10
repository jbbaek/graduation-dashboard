import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = "http://localhost:8000"; // 백엔드 주소에 맞게 수정

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        email,
        password,
      });

      const data = res.data;
      if (data.status === "success") {
        // 토큰 / 유저정보 저장 (필요한 곳에서 사용)
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        // 메인으로 이동
        navigate("/main");
      } else {
        // 백엔드에서 status: "error" 형태로 줄 경우
        alert(data.message || "로그인에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
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
