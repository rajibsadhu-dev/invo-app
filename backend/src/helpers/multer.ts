import multer from "multer";
import path from "path";
import fs from "fs";
import ApiError from "@/app/errors/ApiError";
import httpStatus from "http-status";
import config from "@/config";

export const LOGO_DIR = path.join(process.cwd(), "uploads", "logos");

if (!fs.existsSync(LOGO_DIR)) {
  fs.mkdirSync(LOGO_DIR, { recursive: true });
}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, LOGO_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    // Derive the extension from the sniffed mime type rather than the client-supplied
    // filename, so a crafted originalname cannot choose the extension on disk.
    cb(null, `${unique}${EXT_BY_MIME[file.mimetype] ?? ".bin"}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (EXT_BY_MIME[file.mimetype]) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        httpStatus.BAD_REQUEST,
        "Only JPEG, PNG, and WebP images are allowed"
      )
    );
  }
};

export const uploadLogo = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.max_logo_size_bytes, files: 1 },
}).single("logo");

/** Best-effort removal of an upload whose request went on to fail. */
export const discardUpload = (file?: Express.Multer.File): void => {
  if (!file?.path) return;
  fs.promises.unlink(file.path).catch(() => {
    /* already gone — nothing to do */
  });
};
