import { useState, useEffect } from 'react';

export default function AuthPage({ setAuth }) {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true); // Loader state

    useEffect(() => {
        const checkAuth = async () => {
            console.log('Checking authentication...');
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }
            
            try {
                const response = await fetch(' http://localhost:5001/', {
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
                setLoading(false); // Hide loader after checking auth
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
                    <div className="loader border-t-4 border-blue-500 border-solid rounded-full h-12 w-12 animate-spin"></div>
                    <p className="text-white mt-4">Checking Authentication...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="w-96 bg-white shadow-2xl rounded-xl p-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {isLogin ? "Login" : "Sign Up"}
                    </h2>
                </div>
                {error && <p className="text-red-500 text-center">{error}</p>}
                <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
                    {!isLogin && (
                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    )}
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    <button type="submit" className="w-full p-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">
                        {isLogin ? "Login" : "Sign Up"}
                    </button>
                </form>
                <p className="mt-4 text-center text-gray-600">
                    {isLogin ? "Don't have an account?" : "Already have an account?"} {" "}
                    <span onClick={toggleMode} className="text-blue-600 cursor-pointer hover:underline">
                        {isLogin ? "Sign Up" : "Login"}
                    </span>
                </p>
            </div>
        </div>
    );
}