import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const storage = multer.memoryStorage();

const createUploadMiddleware = (folder, allowedFormats, fileSizeLimit) => {
  const upload = multer({
    storage,
    limits: { fileSize: fileSizeLimit },
  });

  return {
    single: (fieldName) => {
      return (req, res, next) => {
        const multerSingle = upload.single(fieldName);
        multerSingle(req, res, async (err) => {
          if (err) return next(err);
          // If no file is provided, just continue. The controllers handle the validation.
          if (!req.file) return next();

          try {
            const result = await new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                {
                  folder,
                  allowed_formats: allowedFormats,
                  resource_type: "auto",
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              stream.end(req.file.buffer);
            });

            // Populate the properties that were typically provided by multer-storage-cloudinary
            req.file.path = result.secure_url;
            req.file.filename = result.public_id;
            next();
          } catch (uploadError) {
            next(uploadError);
          }
        });
      };
    }
  };
};

export const uploadProfilePic = createUploadMiddleware(
  "chatapp/avatars",
  ["jpg", "jpeg", "png", "webp"],
  5 * 1024 * 1024
);

export const uploadMedia = createUploadMiddleware(
  "chatapp/messages",
  [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "mp4",
    "mov",
    "pdf",
    "doc",
    "docx",
    "txt",
  ],
  50 * 1024 * 1024
);

export const uploadGroupAvatar = createUploadMiddleware(
  "chatapp/groups",
  ["jpg", "jpeg", "png", "webp"],
  5 * 1024 * 1024
);