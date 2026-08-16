import { Router } from "express";
import { uploadImage } from "../storage/cloudinary";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.middleware";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", requireAuth, upload.single("file"), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const result = await uploadImage(req.file.buffer, "mafqudati_reports");
    res.json({ url: result.url, public_id: result.public_id });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
