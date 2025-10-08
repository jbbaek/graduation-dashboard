import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/main");
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
          className="w-full bg-lightGreen hover:bg-midGreen text-white font-bold py-2 rounded-lg mb-2"
        >
          로그인
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
