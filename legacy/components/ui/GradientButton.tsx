export default function GradientButton(
  { children, className = "", ...props }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }
) {
  return (
    <button
      {...props}
      className={
        "rounded-xl px-4 py-2 font-medium " +
        "bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500 " +
        "hover:opacity-95 active:opacity-90 transition-colors " +
        className
      }
    >
      {children}
    </button>
  );
}




