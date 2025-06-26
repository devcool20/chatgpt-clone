import { Attachment } from "ai";

import { LoaderIcon } from "./icons";
import { Button } from "../ui/button";

// Icon components for different file types
const FileIcon = () => (
  <svg className="size-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
  </svg>
);

const PDFIcon = () => (
  <svg className="size-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
    <text x="10" y="13" textAnchor="middle" className="text-xs font-bold fill-white">PDF</text>
  </svg>
);

const DocumentIcon = () => (
  <svg className="size-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
    <text x="10" y="13" textAnchor="middle" className="text-xs font-bold fill-white">DOC</text>
  </svg>
);

const TextIcon = () => (
  <svg className="size-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
    <text x="10" y="13" textAnchor="middle" className="text-xs font-bold fill-white">TXT</text>
  </svg>
);

const getFileIcon = (contentType: string, name: string) => {
  if (contentType.startsWith("image")) return null; // Will show actual image
  if (contentType === "application/pdf") return <PDFIcon />;
  if (contentType.includes("word") || name.endsWith('.doc') || name.endsWith('.docx')) return <DocumentIcon />;
  if (contentType === "text/plain" || name.endsWith('.txt')) return <TextIcon />;
  return <FileIcon />;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Remove button icon
const XIcon = () => (
  <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
  onRemove,
  onExplain,
}: {
  attachment: Attachment;
  isUploading?: boolean;
  onRemove?: () => void;
  onExplain?: () => void;
}) => {
  const { name, url, contentType } = attachment;
  const fileIcon = contentType ? getFileIcon(contentType, name || "") : null;

  return (
    <div className="flex flex-col gap-2 max-w-20 relative group">
      <div className="size-20 bg-muted rounded-md relative flex flex-col items-center justify-center border border-gray-200 dark:border-gray-700">
        {contentType && contentType.startsWith("image") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt={name ?? "An image attachment"}
            className="rounded-md size-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center size-full">
            {fileIcon}
          </div>
        )}

        {isUploading && (
          <div className="animate-spin absolute text-zinc-500 bg-white/80 dark:bg-black/80 rounded-full p-1">
            <LoaderIcon />
          </div>
        )}

        {/* Remove button - only show for non-uploading attachments and when onRemove is provided */}
        {!isUploading && onRemove && (
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            title="Remove attachment"
          >
            <XIcon />
          </button>
        )}
      </div>

      {/* Explain button - only show for images */}
      {contentType && contentType.startsWith("image") && onExplain && (
        <Button
          onClick={onExplain}
          size="sm"
          variant="outline"
          className="text-xs px-2 py-1 h-auto"
        >
          explain
        </Button>
      )}

      <div className="text-xs text-zinc-500 max-w-20 truncate" title={name}>
        {name}
      </div>
      
      {/* Show file size if available */}
      {(attachment as any).size && (
        <div className="text-xs text-zinc-400 max-w-20 truncate">
          {formatFileSize((attachment as any).size)}
        </div>
      )}
    </div>
  );
};
