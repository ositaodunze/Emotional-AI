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
    <div>
      <div>
        <div>
          <h1>Feed Music AI</h1>
          <p>Sign in to continue</p>
        </div>

        <div>
          <form onSubmit={onSubmit}>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@school.edu"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <Button type="submit">
              Sign In
            </Button>
          </form>

          <div>
            <Link to="/signup">
              Need an account? Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

