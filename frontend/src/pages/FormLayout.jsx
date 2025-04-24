import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

// Utility to convert numbers to words (1 -> "One", 2 -> "Two", ..., 26 -> "Twenty-Six")
Number.prototype.toWords = function () {
  const units = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty"];
  if (this < 20) return units[this];
  const digit = this % 10;
  return `${tens[Math.floor(this / 10)]}${digit ? " " + units[digit] : ""}`;
};

// Array of forms for the sidebar menu (Form One to Form Twenty-Six)
const forms = Array.from({ length: 26 }, (_, i) => {
  const formNumber = i + 1;
  const formName = `Form ${formNumber.toWords()}`;
  const formPath = `form-${formNumber}`; // e.g., form-1, form-2, ..., form-26
  return { name: formName, path: formPath };
});

// Utility to convert word-based form path to numeric form path (e.g., "form-one" -> "form-1")
const wordToNumberPath = (wordPath) => {
  const wordMap = {
    "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
    "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
    "eleven": "11", "twelve": "12", "thirteen": "13", "fourteen": "14",
    "fifteen": "15", "sixteen": "16", "seventeen": "17", "eighteen": "18",
    "nineteen": "19", "twenty": "20", "twenty-one": "21", "twenty-two": "22",
    "twenty-three": "23", "twenty-four": "24", "twenty-five": "25", "twenty-six": "26"
  };
  const formWord = wordPath.split("form-")[1]; // e.g., "one" from "form-one"
  return `form-${wordMap[formWord] || formWord}`;
};

// Utility to convert numeric form path to word-based form path (e.g., "form-1" -> "form-one")
const numberToWordPath = (numericPath) => {
  const number = parseInt(numericPath.split("form-")[1], 10); // e.g., 1 from "form-1"
  const wordMap = [
    "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen", "twenty",
    "twenty-one", "twenty-two", "twenty-three", "twenty-four", "twenty-five", "twenty-six"
  ];
  return `form-${wordMap[number] || number}`;
};

export default function FormLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { processId } = useParams();
  const { logout } = useAuthStore();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Extract taskId from query parameters
  const query = new URLSearchParams(location.search);
  const taskId = query.get("taskId");

  // Determine the current form from the URL path
  const currentPath = location.pathname.split("/").pop(); // e.g., "form-one"
  const numericCurrentPath = wordToNumberPath(currentPath); // Convert "form-one" to "form-1"
  const currentForm = forms.find((form) => form.path === numericCurrentPath)?.name || "";

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      const smallScreen = window.innerWidth < 640;
      setIsSmallScreen(smallScreen);
      // Keep sidebar closed by default on all screen sizes
      setIsSidebarOpen(false);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close sidebar when clicking outside on small screens
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.getElementById('form-sidebar');
      const menuButton = document.getElementById('menu-button');
      
      if (isSmallScreen && isSidebarOpen && sidebar && 
          !sidebar.contains(event.target) && 
          menuButton && !menuButton.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSmallScreen, isSidebarOpen]);

  // Handle navigation to a specific form
  const handleNavigation = (formPath) => {
    const basePath = location.pathname.includes("/view-form")
      ? `/view-form/${processId}`
      : `/process/${processId}`;
    const wordFormPath = numberToWordPath(formPath); // Convert "form-1" to "form-one"
    const queryString = taskId ? `?taskId=${taskId}` : "";
    navigate(`${basePath}/${wordFormPath}${queryString}`);
    
    // Close sidebar on mobile after navigation
    if (isSmallScreen) {
      setIsSidebarOpen(false);
    }
  };

  // Handle navigation to dashboard
  const handleNavigateToDashboard = () => {
    navigate("/dashboard");
  };

  // Handle logout
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

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between p-4 bg-white shadow z-30">
        <div className="flex items-center">
          <button 
            id="menu-button"
            onClick={toggleSidebar} 
            className="text-gray-800 focus:outline-none p-2 mr-2"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isSidebarOpen ? (
                // Close Icon (X)
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                // Menu Icon (Three dots in a vertical line)
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              )}
            </svg>
          </button>
          <button
            onClick={handleNavigateToDashboard}
            className="text-xl font-bold text-gray-800 focus:outline-none"
          >
            ECOCS
          </button>
        </div>
        
        {/* Right side: Current form name and Logout button */}
        <div className="flex items-center space-x-4">
          <div className="text-gray-600">
            {currentForm}
          </div>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <div
          id="form-sidebar"
          className={`fixed top-16 left-0 h-[calc(100vh-4rem)] shadow-lg z-20 w-64 transition-transform duration-300 ease-in-out overflow-auto ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Menu Items */}
          <nav className="overflow-y-auto h-full">
            {forms.map((form) => (
              <button
                key={form.path}
                onClick={() => handleNavigation(form.path)}
                className={`block w-full text-left py-3 px-4 text-gray-700 hover:bg-gray-200 transition-colors ${
                  currentForm === form.name ? "bg-purple-300 text-gray-800" : ""
                }`}
              >
                {form.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Overlay for mobile when sidebar is open */}
        {isSmallScreen && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-10"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content Area with padding adjusted for sidebar */}
        <div className={`flex-1 transition-all duration-300 p-6 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        } pt-4 mt-12`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}