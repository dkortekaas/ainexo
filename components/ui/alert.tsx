import React from "react";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "success";
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantClasses = {
      default: "bg-background text-foreground",
      destructive:
        "border-destructive/80 bg-destructive/60 text-white dark:border-destructive [&>svg]:text-destructive",
      success:
        "border-green-700/80 bg-green-700/60 text-white dark:border-green-500 [&>svg]:text-green-500",
    };

    return (
      <div
        className={`relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-white ${variantClasses[variant]} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Alert.displayName = "Alert";

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    className={`text-sm [&_p]:leading-relaxed ${className}`}
    ref={ref}
    {...props}
  />
));

AlertDescription.displayName = "AlertDescription";
