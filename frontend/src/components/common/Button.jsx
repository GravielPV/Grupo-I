export default function Button({
  children,
  type = "button",
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
}) {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-lg px-4 py-3 text-sm font-medium
        transition
        disabled:cursor-not-allowed
        disabled:opacity-60
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
