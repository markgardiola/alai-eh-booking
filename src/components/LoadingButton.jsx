import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// A Button that locks itself while an action is processing: disabled,
// spinner, and optional "Saving..." text, so the user can see their click
// registered even when the server takes a few seconds.
const LoadingButton = ({
  loading = false,
  loadingText,
  disabled,
  children,
  ...props
}) => (
  <Button disabled={disabled || loading} aria-busy={loading} {...props}>
    {loading && <Loader2 className="size-4 animate-spin" />}
    {loading && loadingText ? loadingText : children}
  </Button>
);

export default LoadingButton;
