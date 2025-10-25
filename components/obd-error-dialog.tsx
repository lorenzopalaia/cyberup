"use client";

import React, { useEffect, useState } from "react";
import useOBDData from "@/hooks/use-obd-data";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function OBDErrorDialog() {
  const { errorMessage, clearError } = useOBDData();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(Boolean(errorMessage));
  }, [errorMessage]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) clearError();
        setOpen(v);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{errorMessage?.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {errorMessage?.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => {
              clearError();
              setOpen(false);
            }}
          >
            Chiudi
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
