import { Button } from "./ui/button";

interface RoleSelectorProps {
  selectedRole: "engineer" | "manager" | "executive";
  onChange: (role: "engineer" | "manager" | "executive") => void;
}

export function RoleSelector({ selectedRole, onChange }: RoleSelectorProps) {
  const roles = [
    { value: "engineer", label: "Engineer" },
    { value: "manager", label: "Manager" },
    { value: "executive", label: "Executive" }
  ] as const;

  return (
    <div className="flex bg-stone-900 rounded-md p-1 border border-stone-800">
      {roles.map((role) => (
        <Button
          key={role.value}
          variant="ghost"
          size="sm"
          className={`flex-1 rounded-sm text-xs transition-all h-7 ${
            selectedRole === role.value 
            ? "bg-stone-800 text-stone-200 font-medium shadow-sm" 
            : "text-stone-500 hover:text-stone-300 hover:bg-stone-800/50"
          }`}
          onClick={() => onChange(role.value)}
        >
          {role.label}
        </Button>
      ))}
    </div>
  );
}
