import type { Config } from "tailwindcss";

export default <Partial<Config>>{
  theme: {
    extend: {},
  },
  safelist: [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-slate-500",
    "bg-cyan-500",
  ],
};
