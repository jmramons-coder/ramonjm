"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import styles from "./studio-gallery.module.css";

export type StudioAsset = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
};

export function StudioGallery({
  title,
  description,
  assets,
  href,
  paused = false,
  onClose,
}: {
  title: string;
  description: string;
  assets: readonly StudioAsset[];
  href?: string;
  paused?: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [index, setIndex] = useState(0);
  const asset = assets[index];

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
    };
  }, []);

  function close() {
    dialog.current?.close();
    onClose();
  }
  function move(next: number) {
    setIndex((next + assets.length) % assets.length);
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") move(index + 1);
    else if (event.key === "ArrowLeft") move(index - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(assets.length - 1);
    else return;
    event.preventDefault();
  }

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      data-paused={paused}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const r = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < r.left ||
          event.clientX > r.right ||
          event.clientY < r.top ||
          event.clientY > r.bottom
        )
          close();
      }}
    >
      <header className={styles.header}>
        <div>
          <h2 id={`${id}-title`}>{title}</h2>
          <p id={`${id}-description`}>{description}</p>
        </div>
        <button
          type="button"
          onClick={close}
          className={styles.close}
          aria-label="Close gallery"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </header>
      <div className={styles.stage}>
        <Image
          key={asset.src}
          src={asset.src}
          alt={asset.alt}
          width={asset.width}
          height={asset.height}
          unoptimized
          className={styles.image}
        />
      </div>
      <div className={styles.bottom}>
        <p role="status">
          <span className={styles.count}>
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(assets.length).padStart(2, "0")}
          </span>
          {asset.caption}
        </p>
        <div className={styles.actions}>
          {href && (
            <Link href={href}>
              Full project <span aria-hidden="true">↗</span>
            </Link>
          )}
          <div
            className={styles.navigation}
            role="group"
            aria-label="Gallery navigation"
            onKeyDown={onKeyDown}
          >
            <button
              type="button"
              onClick={() => move(index - 1)}
              aria-label="Previous image"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => move(index + 1)}
              aria-label="Next image"
            >
              →
            </button>
          </div>
        </div>
      </div>
      <div
        className={styles.thumbnails}
        role="group"
        aria-label="Choose an image"
      >
        {assets.map((item, imageIndex) => (
          <button
            key={item.src}
            type="button"
            aria-label={`Show image ${imageIndex + 1}: ${item.alt}`}
            aria-pressed={imageIndex === index}
            onClick={() => setIndex(imageIndex)}
          >
            <Image
              src={item.src}
              alt=""
              width={80}
              height={64}
              unoptimized
              loading="lazy"
            />
          </button>
        ))}
      </div>
    </dialog>
  );
}
