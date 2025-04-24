import { Routes, Route, Navigate } from "react-router-dom";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import { Toaster } from "@/components/ui/toaster";
import { VerificationEmailPage } from "./pages/VerificationEmailPage";
import { useAuthStore } from "./store/authStore";
import { useEffect } from "react";
import DashboardPage from "./pages/DashboardPage";
import CreateUser from "./pages/CreateUser";
import CreateTask from "./pages/CreateTask";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import FormOne from "./pages/FormOne";
import FormTwo from "./pages/FormTwo";
import FormThree from "./pages/FormThree";
import FormFour from "./pages/FormFour";
import FormFive from "./pages/FormFive";
import FormSix from "./pages/FormSix";
import FormSeven from "./pages/FormSeven";
import FormEight from "./pages/FormEight";
import FormNine from "./pages/FormNine";
import FormTen from "./pages/FormTen";
import FormEleven from "./pages/FormEleven";
import FormTwelve from "./pages/FormTwelve";
import FormThirteen from "./pages/FormThirteen";
import FormFourteen from "./pages/FormFourteen";
import FormFifteen from "./pages/FormFifteen";
import ProcessPage from "./pages/ProcessPage";
import FormSixteen from "./pages/FormSixteen";
import FormSeventeen from "./pages/FormSeventeen";
import FormEighteen from "./pages/FormEighteen";
import FormNineteen from "./pages/FormNineteen";
import FormTwenty from "./pages/FormTwenty";
import FormTwentyOne from "./pages/FormTwentyOne";
import FormTwentyTwo from "./pages/FormTwentyTwo";
import FormTwentyThree from "./pages/FormTwentyThree";
import FormTwentyFour from "./pages/FormTwentyFour";
import FormTwentyFive from "./pages/FormTwentyFive";
import FormTwentySix from "./pages/FormTwentySix";
import FormLayout from "./pages/FormLayout";

// Route protection with role-based access
const ProtectRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || !user || (allowedRoles && !allowedRoles.includes(user.role))) {
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
  const { isCheckingAuth, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
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
        <Route
          path="/forgot-password"
          element={
            <AuthenticatedUserRoute>
              <ForgotPasswordPage />
            </AuthenticatedUserRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectRoute allowedRoles={["admin", "manager", "surveyor", "viewer"]}>
              <DashboardPage />
            </ProtectRoute>
          }
        />
        <Route
          path="/create-user"
          element={
            <ProtectRoute allowedRoles={["admin", "manager"]}>
              <CreateUser />
            </ProtectRoute>
          }
        />
        <Route
          path="/create-task"
          element={
            <ProtectRoute allowedRoles={["admin", "manager"]}>
              <CreateTask />
            </ProtectRoute>
          }
        />
        <Route
          path="/processes"
          element={
            <ProtectRoute allowedRoles={["admin", "manager", "surveyor", "viewer"]}>
              <ProcessPage />
            </ProtectRoute>
          }
        />
        {/* Form Routes under /process with FormLayout */}
        <Route
          path="/process/:processId"
          element={
            <ProtectRoute allowedRoles={["admin", "manager", "surveyor", "viewer"]}>
              <FormLayout />
            </ProtectRoute>
          }
        >
          <Route path="form-one" element={<FormOne />} />
          <Route path="new/form-one" element={<ProtectRoute allowedRoles={["surveyor"]}><FormOne /></ProtectRoute>} />
          <Route path="form-two" element={<FormTwo />} />
          <Route path="form-three" element={<FormThree />} />
          <Route path="form-four" element={<FormFour />} />
          <Route path="form-five" element={<FormFive />} />
          <Route path="form-six" element={<FormSix />} />
          <Route path="form-seven" element={<FormSeven />} />
          <Route path="form-eight" element={<FormEight />} />
          <Route path="form-nine" element={<FormNine />} />
          <Route path="form-ten" element={<FormTen />} />
          <Route path="form-eleven" element={<FormEleven />} />
          <Route path="form-twelve" element={<FormTwelve />} />
          <Route path="form-thirteen" element={<FormThirteen />} />
          <Route path="form-fourteen" element={<FormFourteen />} />
          <Route path="form-fifteen" element={<FormFifteen />} />
          <Route path="form-sixteen" element={<FormSixteen />} />
          <Route path="form-seventeen" element={<FormSeventeen />} />
          <Route path="form-eighteen" element={<FormEighteen />} />
          <Route path="form-nineteen" element={<FormNineteen />} />
          <Route path="form-twenty" element={<FormTwenty />} />
          <Route path="form-twenty-one" element={<FormTwentyOne />} />
          <Route path="form-twenty-two" element={<FormTwentyTwo />} />
          <Route path="form-twenty-three" element={<FormTwentyThree />} />
          <Route path="form-twenty-four" element={<FormTwentyFour />} />
          <Route path="form-twenty-five" element={<FormTwentyFive />} />
          <Route path="form-twenty-six" element={<FormTwentySix />} />
        </Route>

        {/* View Form Routes under /view-form with FormLayout */}
        <Route
          path="/view-form/:processId"
          element={
            <ProtectRoute allowedRoles={["admin", "manager", "surveyor", "viewer"]}>
              <FormLayout />
            </ProtectRoute>
          }
        >
          <Route index element={<FormOne />} />
          <Route path="form-one" element={<FormOne />} />
          <Route path="form-two" element={<FormTwo />} />
          <Route path="form-three" element={<FormThree />} />
          <Route path="form-four" element={<FormFour />} />
          <Route path="form-five" element={<FormFive />} />
          <Route path="form-six" element={<FormSix />} />
          <Route path="form-seven" element={<FormSeven />} />
          <Route path="form-eight" element={<FormEight />} />
          <Route path="form-nine" element={<FormNine />} />
          <Route path="form-ten" element={<FormTen />} />
          <Route path="form-eleven" element={<FormEleven />} />
          <Route path="form-twelve" element={<FormTwelve />} />
          <Route path="form-thirteen" element={<FormThirteen />} />
          <Route path="form-fourteen" element={<FormFourteen />} />
          <Route path="form-fifteen" element={<FormFifteen />} />
          <Route path="form-sixteen" element={<FormSixteen />} />
          <Route path="form-seventeen" element={<FormSeventeen />} />
          <Route path="form-eighteen" element={<FormEighteen />} />
          <Route path="form-nineteen" element={<FormNineteen />} />
          <Route path="form-twenty" element={<FormTwenty />} />
          <Route path="form-twenty-one" element={<FormTwentyOne />} />
          <Route path="form-twenty-two" element={<FormTwentyTwo />} />
          <Route path="form-twenty-three" element={<FormTwentyThree />} />
          <Route path="form-twenty-four" element={<FormTwentyFour />} />
          <Route path="form-twenty-five" element={<FormTwentyFive />} />
          <Route path="form-twenty-six" element={<FormTwentySix />} />
        </Route>
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;