import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { user, getTasks, updateTaskStatus, logout } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tasks, setTasks] = useState([]);

  // Fetch tasks on mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const taskList = await getTasks();
        console.log("Fetched tasks:", taskList); // Debug log
        setTasks(taskList || []);
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch tasks.",
        });
      }
    };
    fetchTasks();
  }, [getTasks, toast]);

  const handleViewForm = (task) => {
    if (task.processId) {
      navigate(`/view-form/${task.processId}?taskId=${task._id}`);
    } else {
      toast({
        variant: "warning",
        title: "No Form",
        description: "No form data available for this task.",
      });
    }
  };

  const handleFillForm = (task) => {
    console.log("Handling fill form for task:", task); // Debug log
    console.log("User:", user); // Debug log
    if (task.processId) {
      navigate(`/process/${task.processId}/form-one?taskId=${task._id}`);
    } else {
      navigate(`/process/new/form-one?taskId=${task._id}`);
    }
  };

  const handleUpdateStatus = async (taskId, status) => {
    try {
      await updateTaskStatus(taskId, status);
      const updatedTasks = await getTasks();
      setTasks(updatedTasks || []);
      toast({
        title: "Success",
        description: "Task status updated successfully!",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update task status.",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Success",
        description: "Logged out successfully!",
      });
      navigate("/login");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out.",
      });
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      {/* Header with Welcome Message and Logout Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Dashboard - Welcome, {user.name} ({user.role})
        </h1>
        <Button variant="destructive" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {/* Admin/Manager: Create Task Button */}
      {["admin", "manager"].includes(user.role) && (
        <div className="mb-6">
          <Button onClick={() => navigate("/create-task")}>Create New Task</Button>
        </div>
      )}

      {/* Task List */}
      <h2 className="text-xl font-semibold mb-4">Tasks</h2>
      {tasks.length === 0 ? (
        <p>No tasks available.</p>
      ) : (
        <ul className="space-y-4">
          {tasks.map((task) => (
            <li
              key={task._id}
              className={`border p-4 rounded-lg shadow-sm ${
                user.role === "surveyor" && task.assignedTo?._id === user._id
                  ? "cursor-pointer hover:bg-gray-100"
                  : ""
              }`}
              onClick={
                user.role === "surveyor" && task.assignedTo?._id === user._id
                  ? () => handleFillForm(task)
                  : undefined
              }
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">{task.title}</h3>
                  <p>{task.description || "No description"}</p>
                  <p>
                    Assigned to:{" "}
                    {task.assignedTo?.name
                      ? `${task.assignedTo.name} (${task.assignedTo.email})`
                      : "Unknown"}
                  </p>
                  <p>Status: {task.status}</p>
                </div>
                <div className="space-x-2">
                  {/* Admin/Manager/Viewer: View Form */}
                  {["admin", "manager", "viewer"].includes(user.role) && (
                    <Button variant="outline" onClick={() => handleViewForm(task)}>
                      View Form
                    </Button>
                  )}

                  {/* Admin/Manager/Surveyor: Update Status */}
                  {["admin", "manager", "surveyor"].includes(user.role) && (
                    <select
                      value={task.status}
                      onChange={(e) => handleUpdateStatus(task._id, e.target.value)}
                      className="border rounded px-2 py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}