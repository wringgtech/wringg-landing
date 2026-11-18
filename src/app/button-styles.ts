export type ButtonVariant = "primary" | "secondary" | "dark";

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    "bg-[#2098d6] text-white shadow-sky-500/20 hover:bg-[#1689c8] hover:shadow-sky-500/30",
  secondary:
    "border border-sky-200 bg-white text-[#0f3e5c] shadow-sky-200/40 hover:border-sky-300 hover:bg-sky-50",
  dark: "bg-[#0f3148] text-white shadow-slate-900/15 hover:bg-[#123c58]",
};

export function buttonClassName(variant: ButtonVariant = "primary") {
  return `inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold shadow-lg transition duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-cyan-100 ${variantClassNames[variant]}`;
}
