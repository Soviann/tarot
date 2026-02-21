import { useEffect } from "react";

export function useResetOnOpen(open: boolean, callback: () => void) {
  useEffect(() => {
    if (open) callback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
