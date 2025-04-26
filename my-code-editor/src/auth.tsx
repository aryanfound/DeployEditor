import { useState, useEffect } from 'react';

export default function AuthPage({ setAuth }) {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            console.log('Checking authentication...');
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }
            
            try {
                const response = await fetch('http://localhost:5001/', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                
                if (response.ok) {
                    setIsAuthenticated(true);
                    setAuth(true);
                } else {
                    localStorage.removeItem('token');
                    setIsAuthenticated(false);
                    setAuth(false);
                }
            } catch (error) {
                console.error("Auth check failed", error);
                localStorage.removeItem('token');
                setIsAuthenticated(false);
                setAuth(false);
            } finally {
                setLoading(false);
            }
        };
        
        checkAuth();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setFormData({ name: '', email: '', password: '' });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const endpoint = isLogin ? 'http://localhost:5001/auth/login' : 'http://localhost:5001/auth/signup';
        const body = isLogin ? { email: formData.email, password: formData.password } : formData;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('email', data.useremail);
            setAuth(true);
            setIsAuthenticated(true);
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="flex flex-col items-center">
                    <div className="border-t-4 border-blue-500 border-solid rounded-full h-12 w-12 animate-spin"></div>
                    <p className="text-white mt-4">Checking Authentication...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col">
            {/* Hero Section with Navigation */}
            <div className="bg-gray-900 bg-opacity-40 text-white">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="text-2xl font-bold">
                            <span className="text-white">DeV</span>
                            <span className="text-blue-400">verse</span>
                        </div>
                        <div className="space-x-4">
                            <button 
                                onClick={() => setIsLogin(true)}
                                className={`px-4 py-2 rounded-lg transition ${isLogin ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}
                            >
                                Login
                            </button>
                            <button 
                                onClick={() => setIsLogin(false)}
                                className={`px-4 py-2 rounded-lg transition ${!isLogin ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 items-center justify-center">
                <div className="flex w-full max-w-6xl mx-auto px-6 py-12">
                    {/* Left Side - App Info */}
                    <div className="hidden md:flex md:w-1/2 flex-col justify-center pr-12">
                        <h1 className="text-4xl font-bold text-white mb-6">
                            Welcome to <span className="text-white">DeV</span><span className="text-blue-400">verse</span>
                        </h1>
                        <p className="text-gray-300 text-lg mb-8">
                            Your all-in-one solution for managing tasks, collaborating with teams, and achieving your goals.
                        </p>
                        <div className="flex space-x-6 mb-12">
                            <div className="text-center">
                                <div className="text-blue-400 text-3xl font-bold">10k+</div>
                                <div className="text-gray-400">Users</div>
                            </div>
                            <div className="text-center">
                                <div className="text-blue-400 text-3xl font-bold">50+</div>
                                <div className="text-gray-400">Countries</div>
                            </div>
                            <div className="text-center">
                                <div className="text-blue-400 text-3xl font-bold">99%</div>
                                <div className="text-gray-400">Satisfaction</div>
                            </div>
                        </div>
                        <div className="bg-gray-800 bg-opacity-50 p-6 rounded-xl border border-gray-700">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <h3 className="ml-3 text-xl font-semibold text-white">Trusted Platform</h3>
                            </div>
                            <p className="text-gray-400">
                                Secure, reliable, and constantly evolving to meet your needs.
                            </p>
                        </div>
                    </div>

                    {/* Right Side - Auth Form */}
                    <div className="w-full md:w-1/2">
                        <div className="bg-white shadow-2xl rounded-xl p-8 max-w-md mx-auto">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {isLogin ? "Welcome Back" : "Join Us Today"}
                                </h2>
                                <p className="text-gray-600 mt-2">
                                    {isLogin ? "Log in to access your account" : "Create an account to get started"}
                                </p>
                            </div>
                            
                            {error && (
                                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
                                    <p>{error}</p>
                                </div>
                            )}
                            
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                {!isLogin && (
                                    <div>
                                        <label className="block text-gray-700 text-sm font-semibold mb-2">Full Name</label>
                                        <input 
                                            type="text" 
                                            name="name" 
                                            value={formData.name} 
                                            onChange={handleChange} 
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                            required 
                                        />
                                    </div>
                                )}
                                
                                <div>
                                    <label className="block text-gray-700 text-sm font-semibold mb-2">Email Address</label>
                                    <input 
                                        type="email" 
                                        name="email" 
                                        value={formData.email} 
                                        onChange={handleChange} 
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                        required 
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
                                    <input 
                                        type="password" 
                                        name="password" 
                                        value={formData.password} 
                                        onChange={handleChange} 
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                        required 
                                    />
                                </div>
                                
                                {isLogin && (
                                    <div className="flex justify-end">
                                        <a href="#" className="text-sm text-blue-600 hover:underline">Forgot password?</a>
                                    </div>
                                )}
                                
                                <button 
                                    type="submit" 
                                    className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition mt-2"
                                >
                                    {isLogin ? "Login" : "Create Account"}
                                </button>
                            </form>
                            
                            <div className="mt-6 text-center">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white text-gray-500">Or continue with</span>
                                    </div>
                                </div>
                                
                                <div className="mt-4 flex justify-center gap-4">
                                    {/* Social login buttons can be added here */}
                                </div>
                            </div>
                            
                            <p className="mt-6 text-center text-gray-600">
                                {isLogin ? "Don't have an account?" : "Already have an account?"} {" "}
                                <span onClick={toggleMode} className="text-blue-600 cursor-pointer hover:underline font-medium">
                                    {isLogin ? "Sign Up" : "Login"}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-900 py-6">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="text-gray-400 text-sm mb-4 md:mb-0">
                            © 2025 <span className="text-white">DeV</span><span className="text-blue-400">verse</span>. All rights reserved.
                        </div>
                        <div className="flex space-x-6">
                            <a href="#" className="text-gray-400 hover:text-white transition">Terms</a>
                            <a href="#" className="text-gray-400 hover:text-white transition">Privacy</a>
                            <a href="#" className="text-gray-400 hover:text-white transition">Support</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}