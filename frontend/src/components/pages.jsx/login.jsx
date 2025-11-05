import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error("Please fill in all fields");
    toast.success("Signed in!");
    navigate("/"); // or navigate("/player") later
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Feed Music AI
          </h1>
          <p className="text-muted-foreground">Sign in to continue</p>
        </div>

        <div className="bg-card/50 backdrop-blur-xl rounded-3xl p-8 border border-border">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email" type="email" placeholder="you@school.edu" required
                className="bg-input/50 border-border"
                value={form.email}
                onChange={(e)=>setForm({...form, email:e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password" type="password" placeholder="••••••••" required
                className="bg-input/50 border-border"
                value={form.password}
                onChange={(e)=>setForm({...form, password:e.target.value})}
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90">
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/signup" className="text-sm text-muted-foreground hover:text-foreground">
              Need an account? Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
