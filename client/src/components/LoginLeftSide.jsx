import { LayoutGrid, CheckCircle2 } from "lucide-react";

const LoginLeftSide = () => {
  const points = [
    "Track attendance & working hours",
    "Manage leave requests in one place",
    "Generate and view payslips instantly",
  ];

  return (
    <div className="hidden md:flex w-1/2 bg-ink-900 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-600/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-20 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-start justify-between p-12 lg:p-20 w-full h-full">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center">
            <LayoutGrid className="w-5 h-5" />
          </span>
          <span className="text-white font-semibold">QuickEMS</span>
        </div>

        <div>
          <h1 className="text-4xl lg:text-5xl font-semibold text-white mb-6 leading-tight tracking-tight">
            Employee
            <br />
            Management
            <br />
            System
          </h1>
          <p className="text-ink-300 text-lg max-w-md leading-relaxed">
            Streamline your workforce management with a clean, fast, and reliable platform.
          </p>

          <ul className="mt-10 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-ink-200">
                <CheckCircle2 className="w-5 h-5 text-primary-400 shrink-0" />
                <span className="text-sm">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-ink-500 text-sm">© {new Date().getFullYear()} QuickEMS. All rights reserved.</p>
      </div>
    </div>
  );
};

export default LoginLeftSide;
