"use client";

import { useState } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import PauseIcon from "@hugeicons/core-free-icons/PauseIcon";
import PlayIcon from "@hugeicons/core-free-icons/PlayIcon";

const clients = [
  {
    name: "Equisoft",
    slug: "equisoft",
    logo: "/client-equisoft.svg",
    width: 160,
    height: 40,
  },
  {
    name: "FolksHR",
    slug: "folks",
    logo: "/client-folks.svg",
    width: 77,
    height: 24,
  },
  {
    name: "PetalMD",
    slug: "petalmd",
    logo: "/client-petalmd.svg",
    width: 163,
    height: 72,
  },
  {
    name: "Peak Media",
    slug: "peak-media",
    logo: "/client-peak-media.svg",
    width: 462,
    height: 253,
  },
] as const;

const marqueeCopies = [0, 1, 2, 3] as const;

export function ClientMarquee() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <>
      <ul className="sr-only" aria-label="Client logos">
        {clients.map((client) => (
          <li key={client.slug}>{client.name}</li>
        ))}
      </ul>

      <div className="clients-marquee-shell">
        <div className="clients-marquee" aria-hidden="true">
          <div className={`clients-track${isPaused ? " is-paused" : ""}`}>
            {marqueeCopies.map((copy) => (
              <ul className="client-logo-group" key={copy}>
                {clients.map((client) => (
                  <li className="client-logo-item" key={client.slug}>
                    <Image
                      className={`client-logo client-logo--${client.slug}`}
                      src={client.logo}
                      alt=""
                      width={client.width}
                      height={client.height}
                      unoptimized
                    />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        <button
          className="clients-motion-toggle"
          type="button"
          aria-label={
            isPaused
              ? "Play client logo animation"
              : "Pause client logo animation"
          }
          aria-pressed={isPaused}
          onClick={() => setIsPaused((paused) => !paused)}
        >
          <HugeiconsIcon
            icon={isPaused ? PlayIcon : PauseIcon}
            size={18}
            strokeWidth={1.8}
          />
        </button>
      </div>
    </>
  );
}
