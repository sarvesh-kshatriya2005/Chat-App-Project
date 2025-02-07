import { useState } from "react";
import "./login.css";
import { toast } from "react-toastify";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./lib/firebase";

const Login = () => {
  const [loading, setLoading] = useState(false);

  // Handle user registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const { username, email, password } = Object.fromEntries(formData);

    try {
      // Create user with email and password
      const res = await createUserWithEmailAndPassword(auth, email, password);

      // Create user document in Firestore without avatar
      await setDoc(doc(db, "users", res.user.uid), { 
        username,
        email,
        id: res.user.uid,
        blocked: [],
      });

      // Create user chats document
      await setDoc(doc(db, "userchats", res.user.uid), {
        chats: [],
      });

      toast.success(`${username} Successfully Registered`);
    } catch (err) {
      console.log(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle user login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.log(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="item">
        <h2>Welcome Back</h2>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" name="email" autoComplete="username"/>
          <input type="password" placeholder="Password" name="password" autoComplete="current-password"/>
          <button disabled={loading}>{loading ? "Loading..." : "Sign In"}</button>
        </form>
      </div>
      <div className="seprator"></div>
      <div className="item">
        <h2>Create account</h2>
        <form onSubmit={handleRegister}>
          <input type="text" placeholder="Username" name="username" />
          <input type="email" placeholder="Email" name="email" autoComplete="username"/>
          <input type="password" placeholder="Password" name="password" autoComplete="current-password"/>
          <button disabled={loading}>{loading ? "Loading..." : "Sign Up"}</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
