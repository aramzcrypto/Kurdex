import React from "react";
import { Slot } from "expo-router";
import { WebShell } from "../../components/web/WebShell";

export default function WebLayout() {
  return (
    <WebShell>
      <Slot />
    </WebShell>
  );
}
