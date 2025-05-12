import { useState, FormEvent } from "react";
import { supabase } from "../supabaseClient";
import "../App.css";
import Logo from "../assets/img/Logo.png";
import Frame from "../assets/img/Frame.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast.error("Login failed: " + error.message);
    } else {
      toast.success("Login successful!");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      <div className="hidden md:flex w-full md:w-1/2 bg-gray-50 items-center justify-center p-4">
        <img
          src={Frame}
          alt="Login Illustration"
          className="max-w-xs md:max-w-3xl w-full"
        />
      </div>

      <div className="w-full md:w-1/2 flex flex-col justify-center items-center bg-white px-4 h-screen">
        <div className="w-full max-w-lg mb-4 text-center md:text-left">
          <img
            src={Logo}
            alt="Novumlogic Logo"
            className="max-w-[180px] inline-block"
          />
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white p-6 md:p-10 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.1)] w-full max-w-lg"
        >
          <h2 className="text-2xl font-semibold mb-4">Login</h2>

          <input
            type="email"
            placeholder="Email"
            className="border border-gray-400 p-2 w-full mb-4 rounded"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="border border-gray-400 p-2 w-full rounded pr-10"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </span>
          </div>

          <div className="flex items-center justify-between text-sm mb-4">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              Remember Me
            </label>
          </div>

          <button
            type="submit"
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 w-full rounded disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
