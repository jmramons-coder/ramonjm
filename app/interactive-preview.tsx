type InteractivePreviewProps = {
  src: string;
  title: string;
  hostname: string;
  className?: string;
};

export function InteractivePreview({
  src,
  title,
  hostname,
  className,
}: InteractivePreviewProps) {
  return (
    <div className={`interactive-preview ${className ?? ""}`.trim()}>
      <div className="interactive-preview-toolbar" aria-hidden="true">
        <span className="interactive-preview-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="interactive-preview-url">{hostname}</span>
        <span className="interactive-preview-label">Live preview</span>
      </div>
      <div className="interactive-preview-viewport">
        <iframe
          src={src}
          title={title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
