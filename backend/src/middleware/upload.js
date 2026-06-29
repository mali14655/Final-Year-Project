import multer from "multer";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_BYTES },
});

export function handleAvatarUpload(req, res, next) {
  avatarUpload.single("avatar")(req, res, (err) => {
    if (!err) {
      return next();
    }

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Image must be smaller than 2MB" });
    }

    return res.status(400).json({ error: err.message || "Upload failed" });
  });
}
