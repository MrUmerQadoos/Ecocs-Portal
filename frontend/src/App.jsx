import { Routes, Route, Navigate } from "react-router-dom";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import { Toaster } from "@/components/ui/toaster";
import { VerificationEmailPage } from "./pages/VerificationEmailPage";
import { useAuthStore } from "./store/authStore";
import { useEffect } from "react";
import DashboardPage from "./pages/DashboardPage";
import { Button } from "./components/ui/button";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import FormOne from "./pages/FormOne";
import FormTwo from "./pages/FormTwo";
import ProcessPage from "./pages/ProcessPage"; // Import the new process page
import { useParams } from "react-router-dom";
import FormThree from "./pages/FormThree";
import FormFour from "./pages/FormFour";
import FormFive from "./pages/FormFive";
import FormSix from "./pages/FormSIx";
import FormSeven from "./pages/FormSeven";
import FormNine from "./pages/FormNine";
import FormEight from "./pages/FormEight";
import FormTen from "./pages/FormTen";
import FormEleven from "./pages/FormEleven";
import FormTwelve from "./pages/FormTwelve";
import FormThirteen from "./pages/FormThirteen";
import FormFourteen from "./pages/FormFourteen";
import FormFifteen from "./pages/FormFifteen";

// Route protection components…
const ProtectRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated && !user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AuthenticatedUserRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  const { isCheckingAuth, checkAuth, logout, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return <div>Loading...</div>;
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div>
      {user && <Button onClick={handleLogout}>Logout</Button>}
      <Routes>
        <Route path="/" element={"Home"} />
        <Route
          path="/signup"
          element={
            <AuthenticatedUserRoute>
              <SignUpPage />
            </AuthenticatedUserRoute>
          }
        />
        <Route
          path="/login"
          element={
            <AuthenticatedUserRoute>
              <LoginPage />
            </AuthenticatedUserRoute>
          }
        />
        <Route path="/verify-email" element={<VerificationEmailPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        {/* Process Dashboard */}
        <Route
          path="/processes"
          element={
            <ProtectRoute>
              <ProcessPage />
            </ProtectRoute>
          }
        />
        {/* Process-specific routes: note that FormOne (and subsequent forms)
            can use the processId from the URL via useParams */}
        <Route
          path="/process/:processId/form-one"
          element={
            <ProtectRoute>
              <FormOne />
            </ProtectRoute>
          }
        />
        <Route
          path="/process/:processId/form-two"
          element={
            <ProtectRoute>
              <FormTwo />
            </ProtectRoute>
          }
        />
        <Route
          path="/process/:processId/form-three"
          element={
            <ProtectRoute>
              <FormThree />
            </ProtectRoute>
          }
        />

<Route
          path="/process/:processId/form-four"
          element={
            <ProtectRoute>
              <FormFour />
            </ProtectRoute>
          }
        />

<Route
          path="/process/:processId/form-five"
          element={
            <ProtectRoute>
              <FormFive />
            </ProtectRoute>
          }
        />


<Route
          path="/process/:processId/form-six"
          element={
            <ProtectRoute>
              <FormSix />
            </ProtectRoute>
          }
        />


<Route
          path="/process/:processId/form-seven"
          element={
            <ProtectRoute>
              <FormSeven />
            </ProtectRoute>
          }
        />
        <Route
          path="/process/:processId/form-eight"
          element={
            <ProtectRoute>
              <FormEight />
            </ProtectRoute>
          }
        />
        <Route
          path="/process/:processId/form-nine"
          element={
            <ProtectRoute>
              <FormNine />
            </ProtectRoute>
          }
        />
        <Route
          path="/process/:processId/form-ten"
          element={
            <ProtectRoute>
              <FormTen />
            </ProtectRoute>
          }
        />
        <Route
          path="/process/:processId/form-eleven"
          element={
            <ProtectRoute>
              <FormEleven />
            </ProtectRoute>
          }
        />

<Route
          path="/process/:processId/form-twelve"
          element={
            <ProtectRoute>
              <FormTwelve />
            </ProtectRoute>
          }
        />

<Route
          path="/process/:processId/form-thirteen"
          element={
            <ProtectRoute>
              <FormThirteen/>
            </ProtectRoute>
          }
        />
        <Route
          path="/process/:processId/form-fourteen"
          element={
            <ProtectRoute>
              <FormFourteen/>
            </ProtectRoute>
          }
        />
          <Route
          path="/process/:processId/form-fifteen"
          element={
            <ProtectRoute>
              <FormFifteen/>
            </ProtectRoute>
          }
        />
        
        {/* Other routes… */}
        <Route
          path="/dashboard"
          element={
            <ProtectRoute>
              <DashboardPage />
            </ProtectRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <AuthenticatedUserRoute>
              <ForgotPasswordPage />
            </AuthenticatedUserRoute>
          }
        />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
