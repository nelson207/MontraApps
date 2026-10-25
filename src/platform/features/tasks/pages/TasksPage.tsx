import { TasksSearch } from "../components/AssignedTasks";

// /tasks: every assigned task, searched and filtered like the home card (filters in the URL).
export default function TasksPage() {
  return (
    <div className="app-page">
      <TasksSearch />
    </div>
  );
}
