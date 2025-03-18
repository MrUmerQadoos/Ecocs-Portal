import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";

export default function ProcessPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch processes for the current user
  const fetchProcesses = async () => {
    if (user && user._id) {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3000/api/processes?userId=${user._id}`);
        const data = await res.json();
        if (data.success) {
          setProcesses(data.data);
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: data.error || "Failed to fetch processes.",
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error fetching processes.",
        });
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
  }, [user]);

  // Create a new process and redirect to Form One with the new process ID.
  const handleNewProcess = async () => {
    if (!user || !user._id) return;
    try {
      const res = await fetch(`http://localhost:3000/api/processes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, name: "New Process" }),
      });
      const data = await res.json();
      if (data.success) {
        // Redirect to Form One route with the processId as a URL parameter.
        navigate(`/process/${data.data._id}/form-one`);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to create process.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error creating process.",
      });
    }
  };

  // Start (or resume) an existing process by redirecting to Form One.
  const handleStartProcess = (processId) => {
    navigate(`/process/${processId}/form-one`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Your Processes</h1>
        <Button onClick={handleNewProcess}>Create New Process</Button>
        {loading ? (
          <p className="mt-4">Loading processes...</p>
        ) : (
          <div className="mt-6">
            {processes.length === 0 ? (
              <p>No processes found. Create one to get started!</p>
            ) : (
              <ul>
                {processes.map((process) => (
                  <li
                    key={process._id}
                    className="flex justify-between items-center border p-4 rounded mb-2"
                  >
                    <div>
                      <p className="font-semibold">
                        {process.name || "Untitled Process"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Status: {process.status}
                      </p>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(process.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Button onClick={() => handleStartProcess(process._id)}>
                      Start / Continue
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
