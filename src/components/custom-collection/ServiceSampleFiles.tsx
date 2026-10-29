"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileText, Loader2, Trash2, UploadCloud } from "lucide-react";
import {
  DashboardButton as Button,
  DashboardCard as Card,
  DashboardCardContent as CardContent,
  DashboardCardHeader as CardHeader,
  DashboardCardTitle as CardTitle,
} from "@/components/dashboard";
import { useAuthStore } from "@/store/auth.store";
import { serviceSamplesApi } from "@/lib/api/custom-collection";
import type { CustomCollectionSampleFile } from "@/types/custom-collection.types";

const size = (value: string | number) =>
  Number(value) >= 1_000_000_000
    ? `${(Number(value) / 1_000_000_000).toFixed(2)} GB`
    : `${(Number(value) / 1_000_000).toFixed(2)} MB`;
const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Could not update sample files. Please try again.";
export function ServiceSampleFiles({
  serviceId,
  revisionId,
  files = [],
  editable,
  onChanged,
}: {
  serviceId: string;
  revisionId: string;
  files?: CustomCollectionSampleFile[];
  editable: boolean;
  onChanged: () => Promise<void>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const transport = useRef<XMLHttpRequest | null>(null);
  const mounted = useRef(true);
  const actor = useAuthStore((state) => state.user?.id);
  const actorRef = useRef(actor);
  useEffect(() => {
    actorRef.current = actor;
    return () => {
      actorRef.current = undefined;
      transport.current?.abort();
    };
  }, [actor]);
  const [config, setConfig] = useState<Awaited<
    ReturnType<typeof serviceSamplesApi.configuration>
  > | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    mounted.current = true;
    if (editable)
      serviceSamplesApi
        .configuration()
        .then((value) => {
          if (mounted.current) setConfig(value);
        })
        .catch((err) => {
          if (mounted.current) setError(message(err));
        });
    return () => {
      mounted.current = false;
      transport.current?.abort();
    };
  }, [editable]);
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      if (mounted.current) await onChanged();
    } catch (err) {
      if (mounted.current) {
        setError(message(err));
        await onChanged();
      }
    } finally {
      if (mounted.current) {
        setBusy(false);
        setProgress(null);
      }
    }
  }
  async function upload(selected: FileList | null) {
    if (!selected || !config || !editable) return;
    const chosen = Array.from(selected);
    if (
      chosen.length + files.length > config.maxFiles ||
      chosen.reduce(
        (total, file) => total + file.size,
        files.reduce((total, file) => total + Number(file.sizeBytes), 0)
      ) > Number(config.maximumTotalBytes)
    ) {
      setError(
        `Choose up to ${config.maxFiles} samples totalling ${size(config.maximumTotalBytes)}.`
      );
      return;
    }
    const startedActor = actor;
    if (!startedActor) {
      setError("Sign in before uploading samples.");
      return;
    }
    await run(async () => {
      for (const file of chosen) {
        if (!mounted.current || actorRef.current !== startedActor) return;
        if (
          !file.size ||
          !config.formats.some((format) =>
            format.extensions.some((ext) =>
              file.name.toLowerCase().endsWith(ext)
            )
          )
        )
          throw new Error(
            "Choose a supported, non-empty data file or ZIP archive."
          );
        setProgress(`Preparing ${file.name}…`);
        const started = await serviceSamplesApi.start(
          serviceId,
          revisionId,
          file,
          crypto.randomUUID()
        );
        if (!mounted.current || actorRef.current !== startedActor) return;
        if (started.upload) {
          const signed = started.upload;
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            transport.current = xhr;
            xhr.open("PUT", signed.uploadUrl);
            for (const [name, value] of Object.entries(signed.headers))
              xhr.setRequestHeader(name, value);
            xhr.upload.onprogress = (event) => {
              if (mounted.current)
                setProgress(
                  `${file.name} · ${event.lengthComputable ? `${Math.floor((event.loaded / event.total) * 100)}%` : size(event.loaded)}`
                );
            };
            xhr.onload = () =>
              (xhr.status >= 200 && xhr.status < 300) || xhr.status === 412
                ? resolve()
                : reject(
                    new Error(
                      "The file upload could not finish. Try Finish upload, or remove it and select the file again."
                    )
                  );
            xhr.onerror = () =>
              reject(
                new Error(
                  "The file transfer was interrupted. Try Finish upload, or remove it and select the file again."
                )
              );
            xhr.onabort = () =>
              reject(
                new Error(
                  "The file transfer was stopped. You can remove the unfinished upload."
                )
              );
            xhr.send(file);
          });
          transport.current = null;
          if (!mounted.current || actorRef.current !== startedActor) return;
          setProgress(`Finishing ${file.name}…`);
          await serviceSamplesApi.complete(
            serviceId,
            revisionId,
            started.sample.id
          );
        }
        if (mounted.current) await onChanged();
      }
    });
    if (input.current) input.current.value = "";
  }
  async function download(file: CustomCollectionSampleFile) {
    const startedActor = actor;
    await run(async () => {
      const result = await serviceSamplesApi.download(
        serviceId,
        revisionId,
        file.id
      );
      if (!mounted.current || actorRef.current !== startedActor) return;
      const link = document.createElement("a");
      link.href = result.url;
      link.download = result.fileName;
      link.rel = "noopener";
      link.click();
    });
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sample files</CardTitle>
        <p className="text-sm text-muted-foreground">
          Optional examples buyers can download free after this service revision
          is approved and published.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!files.length && (
          <p className="text-sm text-muted-foreground">No samples added.</p>
        )}
        <ul className="space-y-3">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-2">
                <FileText
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="break-all text-sm font-medium">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {size(file.sizeBytes)} ·{" "}
                    {file.status === "READY"
                      ? "Uploaded"
                      : "Upload not finished"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {file.status === "READY" ? (
                  <Button
                    size="compact"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void download(file)}
                  >
                    <Download className="h-4 w-4" />
                    View sample
                  </Button>
                ) : (
                  editable && (
                    <Button
                      size="compact"
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void run(() =>
                          serviceSamplesApi.complete(
                            serviceId,
                            revisionId,
                            file.id
                          )
                        )
                      }
                    >
                      Finish upload
                    </Button>
                  )
                )}
                {editable && (
                  <Button
                    size="compact"
                    variant="ghost"
                    aria-label={`Remove ${file.fileName}`}
                    disabled={busy}
                    onClick={() =>
                      void run(() =>
                        serviceSamplesApi.remove(serviceId, revisionId, file.id)
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
        {editable && (
          <div className="space-y-2">
            <input
              ref={input}
              type="file"
              multiple
              accept={config?.formats
                .flatMap((format) => format.extensions)
                .join(",")}
              className="hidden"
              aria-label="Service sample files"
              onChange={(event) => void upload(event.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={busy || !config}
              onClick={() => input.current?.click()}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}
              Add sample files
            </Button>
            <p className="text-xs text-muted-foreground">
              Add data files or a ZIP bundle.{" "}
              {config
                ? `Up to ${config.maxFiles} files, ${size(config.maximumTotalBytes)} total.`
                : "Loading upload limits…"}{" "}
              Only upload files you are authorised to share.
            </p>
          </div>
        )}
        {progress && (
          <p className="break-all text-sm" role="status">
            {progress}
          </p>
        )}
        {!config && editable && error && (
          <Button
            variant="outline"
            onClick={() => {
              setError(null);
              void serviceSamplesApi
                .configuration()
                .then((value) => {
                  if (mounted.current) setConfig(value);
                })
                .catch((err) => {
                  if (mounted.current) setError(message(err));
                });
            }}
          >
            Retry upload setup
          </Button>
        )}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
