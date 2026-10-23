"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  getSupplierProfile,
  presignSupplierLogoUpload,
  completeSupplierLogoUpload,
} from "@/lib/api/supplier";
import { uploadFileToS3 } from "@/lib/api/dataset-proposals";
import type { SupplierLogoContentType } from "@/types/onboarding.types";
import styles from "./supplier-onboarding.module.css";

export function SupplierProfileLogo() {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    getSupplierProfile()
      .then((result) => {
        if (active) setUrl(result.profile?.logoUrl ?? null);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <section className={`${styles.panel} mt-6`}>
      <h2 className={styles.subsectionTitle}>Supplier logo</h2>
      <p className={styles.muted}>
        This logo is part of your public supplier presentation. Verification
        documents remain private.
      </p>
      {url && (
        <Image
          src={url}
          alt="Your supplier logo"
          width={96}
          height={96}
          unoptimized
          className="my-4 rounded-xl object-contain"
        />
      )}
      <label className={`${styles.field} mt-4 max-w-md`}>
        Update logo
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setError("");
            setNotice("");
            if (file.size > 2 * 1024 * 1024) {
              setError("Choose an image up to 2 MB.");
              return;
            }
            setBusy(true);
            try {
              const contentType = file.type as SupplierLogoContentType;
              const signed = await presignSupplierLogoUpload({
                originalFileName: file.name,
                contentType,
              });
              await uploadFileToS3(signed.putUrl, file);
              const complete = await completeSupplierLogoUpload({
                s3Key: signed.s3Key,
                sizeBytes: String(file.size),
              });
              setUrl(complete.profile.logoUrl);
              setNotice("Logo saved.");
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Logo upload failed"
              );
            } finally {
              setBusy(false);
            }
          }}
        />
        <small>
          Square PNG, JPEG or WebP, 256–2048 pixels on each side, up to 2 MB.
        </small>
      </label>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className={styles.notice}>
          {notice}
        </p>
      )}
    </section>
  );
}
