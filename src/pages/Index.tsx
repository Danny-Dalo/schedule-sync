import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Task, SortField, SortOrder } from "@/types/task";
import { TaskItem } from "@/components/TaskItem";
import { TaskDialog } from "@/components/TaskDialog";
import { TaskFilters } from "@/components/TaskFilters";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, LogOut, Brain } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("priority");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!session?.user) return;

    // Fetch user profile and tasks
    const fetchData = async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .single();

      if (profileData) {
        setUsername(profileData.username || "");
      }

      // Fetch tasks
      const { data: tasksData, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (tasksData && !error) {
        const formattedTasks: Task[] = tasksData.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description || "",
          status: task.status as Task["status"],
          priority: task.priority as Task["priority"],
          dueDate: task.due_date ? new Date(task.due_date) : null,
          createdAt: new Date(task.created_at),
          updatedAt: new Date(task.updated_at),
        }));
        setTasks(formattedTasks);
      }
    };

    fetchData();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSaveTask = async (taskData: Omit<Task, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
    if (!session?.user) return;

    const now = new Date();
    
    if (taskData.id) {
      // Update existing task
      const { error } = await supabase
        .from("tasks")
        .update({
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          due_date: taskData.dueDate?.toISOString(),
        })
        .eq("id", taskData.id)
        .eq("user_id", session.user.id);

      if (!error) {
        setTasks(tasks.map(task => 
          task.id === taskData.id 
            ? { ...task, ...taskData, updatedAt: now }
            : task
        ));
        toast.success("Task updated successfully");
      } else {
        toast.error("Failed to update task");
      }
    } else {
      // Create new task
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: session.user.id,
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          due_date: taskData.dueDate?.toISOString(),
        })
        .select()
        .single();

      if (data && !error) {
        const newTask: Task = {
          id: data.id,
          title: data.title,
          description: data.description || "",
          status: data.status as Task["status"],
          priority: data.priority as Task["priority"],
          dueDate: data.due_date ? new Date(data.due_date) : null,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setTasks([newTask, ...tasks]);
        toast.success("Task created successfully");
      } else {
        toast.error("Failed to create task");
      }
    }
    
    setEditingTask(null);
  };

  const handleDeleteTask = async (id: string) => {
    if (!session?.user) return;

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (!error) {
      setTasks(tasks.filter(task => task.id !== id));
      toast.success("Task deleted");
    } else {
      toast.error("Failed to delete task");
    }
  };

  const handleStatusChange = async (id: string, status: Task["status"]) => {
    if (!session?.user) return;

    const { error } = await supabase
      .from("tasks")
      .update({ status })
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (!error) {
      setTasks(tasks.map(task => 
        task.id === id 
          ? { ...task, status, updatedAt: new Date() }
          : task
      ));
      toast.success(`Task marked as ${status}`);
    } else {
      toast.error("Failed to update task status");
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleNewTask = () => {
    setEditingTask(null);
    setDialogOpen(true);
  };

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case "dueDate":
          const aDate = a.dueDate?.getTime() || Infinity;
          const bDate = b.dueDate?.getTime() || Infinity;
          comparison = aDate - bDate;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [tasks, searchQuery, sortField, sortOrder]);

  const stats = useMemo(() => {
    const completed = tasks.filter(t => t.status === "completed").length;
    const ongoing = tasks.filter(t => t.status === "ongoing").length;
    const pending = tasks.filter(t => t.status === "pending").length;
    return { completed, ongoing, pending, total: tasks.length };
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {username ? `${username}'s Tasks` : "Task Manager"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button onClick={() => navigate("/focus")} variant="outline">
                <Brain className="h-4 w-4 mr-2" />
                Focus
              </Button>
              <Button onClick={handleLogout} variant="outline" size="icon">
                <LogOut className="h-4 w-4" />
              </Button>
              <Button onClick={handleNewTask} className="gap-2">
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground">
            Organize and track your tasks efficiently
          </p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">Total</p>
            <p className="text-2xl font-bold text-card-foreground">{stats.total}</p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">Pending</p>
            <p className="text-2xl font-bold text-card-foreground">{stats.pending}</p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">Ongoing</p>
            <p className="text-2xl font-bold text-primary">{stats.ongoing}</p>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">Completed</p>
            <p className="text-2xl font-bold text-accent">{stats.completed}</p>
          </div>
        </div>

        <div className="mb-6">
          <TaskFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortField={sortField}
            sortOrder={sortOrder}
            onSortChange={(field, order) => {
              setSortField(field);
              setSortOrder(order);
            }}
          />
        </div>

        <div className="space-y-3">
          {filteredAndSortedTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? "No tasks found" : "No tasks yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search" : "Create your first task to get started"}
              </p>
              {!searchQuery && (
                <Button onClick={handleNewTask}>Create Task</Button>
              )}
            </div>
          ) : (
            filteredAndSortedTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>

        <TaskDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          task={editingTask}
          onSave={handleSaveTask}
        />
      </div>
    </div>
  );
};

export default Index;
