import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function CreateTask() {
  const { user, createTask, getUsers } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
  });
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  // Fetch users for assignment
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userList = await getUsers();
        setUsers(userList.filter((u) => u.role === "surveyor") || []);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchUsers();
  }, [getUsers]);

  // Redirect if user is not admin or manager
  useEffect(() => {
    if (user && !["admin", "manager"].includes(user.role)) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await createTask(formData.title, formData.description, formData.assignedTo);
      toast({
        title: "Success",
        description: "Task created successfully!",
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    }
  };

  if (!user || !["admin", "manager"].includes(user.role)) {
    return null;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter task title"
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter task description"
            required
          />
        </div>
        <div>
          <Label htmlFor="assignedTo">Assign To (Surveyor)</Label>
          <select
            id="assignedTo"
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleChange}
            className="w-full border rounded px-2 py-2"
            required
          >
            <option value="">Select a surveyor</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <div className="flex space-x-2">
          <Button type="submit">Create Task</Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}