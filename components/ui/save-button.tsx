import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Save as SaveIcon } from "lucide-react";

type SaveButtonProps = React.ComponentProps<"button"> & {
  isLoading?: boolean;
  icon?: React.ReactNode;
};

export function SaveButton({
  className,
  isLoading = false,
  disabled,
  children,
  icon,
  ...props
}: SaveButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Button
      className={`bg-primary hover:bg-primary/80 ${className || ""}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          {icon === null ? null : icon ? (
            icon
          ) : (
            <SaveIcon className="w-4 h-4 mr-2" />
          )}
          {children ?? "Save"}
        </>
      )}
    </Button>
  );
}

export default SaveButton;
