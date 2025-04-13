import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [formError, setFormError] = useState("");
  
  const navigate = useNavigate();
  const { login, error, loading, enableGuestMode } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    
    if (!formData.email || !formData.password) {
      setFormError("Please enter both email and password");
      return;
    }

    const success = await login(formData.email, formData.password);
    if (success) {
      navigate("/feed", { replace: true });
    }
  };

  const handleGuestMode = () => {
    enableGuestMode();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <img src="/BuzzlyLogo3.png" alt="Buzzly Logo" className="h-32 w-32" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-orange-900">Welcome to Buzzly</h1>
          <p className="mt-2 text-yellow-600 italic">Stay updated and buzzing with trends.</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8 border border-amber-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
            Sign in to your account
          </h2>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200"
                placeholder="youremail@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200"
                placeholder="••••••••"
              />
            </div>

            {(formError || error) && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                {formError || error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 rounded-lg bg-orange-900 hover:bg-yellow-600 text-white font-medium shadow-sm transition duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">or</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Guest Mode Button */}
          <button
            onClick={handleGuestMode}
            className="w-full flex justify-center items-center py-3 px-4 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium border border-gray-200 shadow-sm transition duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Continue as Guest
          </button>

          <p className="mt-8 text-center text-gray-600">
            Not a member?{' '}
            <Link to="/register" className="font-medium text-orange-900 hover:text-yellow-600 transition duration-200">
              Create an account
            </Link>
          </p>
        </div>
        
        <p className="mt-6 text-center text-xs text-gray-500">
          © 2025 Buzzly. All rights reserved.
        </p>
      </div>
    </div>
  );
}