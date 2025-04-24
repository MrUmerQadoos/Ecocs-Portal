import { useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export function VerificationEmailPage() {
  const [value, setValue] = useState("");
  const { verifyEmail, isLoading, error } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      await verifyEmail(value);
      if (!error && !isLoading) {
        toast({
          title: "Email Verified",
          description: "Your email has been verified successfully",
        });
        navigate("/login"); // Redirect to login after verification
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Verification failed",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Verify Email</h1>
        <div className="space-y-4 flex flex-col w-full mx-auto justify-center">
          <InputOTP
            maxLength={6}
            value={value}
            onChange={(value) => setValue(value)}
          >
            <InputOTPGroup className="mx-auto">
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <div className="text-center text-sm">
            {value === "" ? (
              <>Enter your verification email code.</>
            ) : (
              <>You entered: {value}</>
            )}
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Button onClick={handleSubmit} className="w-full" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify Email Now"}
          </Button>
        </div>
      </div>
    </div>
  );
}