"use client";
import { useRouter } from "next/navigation";
import { DatasetPreparationEditor } from "./DatasetPreparationEditor";

export function DatasetPreparationScreen({ draftId }: { draftId?: string }) {
  const router = useRouter();
  return (
    <DatasetPreparationEditor
      key={draftId ?? "new"}
      draftId={draftId}
      onCreated={(id) => {
        // Keep in-memory step/input after the first save while giving reloads a
        // stable server-backed URL. Next supports native history integration.
        window.history.replaceState(
          window.history.state,
          "",
          `/dashboard/datasets/drafts/${id}`
        );
      }}
      onExit={() => router.push("/dashboard/datasets")}
    />
  );
}
