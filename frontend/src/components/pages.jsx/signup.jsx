import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Sign up successful!");
    navigate("/login");
  };
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Feed Music AI
          </h1>
          <p className="text-muted-foreground">Create your account</p>
        </div>
        <div className="bg-card/50 backdrop-blur-xl rounded-3xl p-8 border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username" placeholder="Enter your username" required
                className="bg-input/50 border-border"
                value={formData.username}
                onChange={(e)=>setFormData({...formData, username:e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email" type="email" placeholder="Enter your email" required
                className="bg-input/50 border-border"
                value={formData.email}
                onChange={(e)=>setFormData({...formData, email:e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password" type="password" placeholder="Create a password" required
                className="bg-input/50 border-border"
                value={formData.password}
                onChange={(e)=>setFormData({...formData, password:e.target.value})}
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90">
              Register
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}