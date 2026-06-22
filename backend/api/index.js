import app from "../server.js";

// Required for multer multipart uploads on Vercel — do not pre-parse the body
export const config = {
  api: {
    bodyParser: false,
  },
};

export default app;
