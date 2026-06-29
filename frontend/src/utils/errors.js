const CODE_MESSAGES = {
  ACCOUNT_NOT_FOUND: "No account found with this email.",
  ACCOUNT_PENDING:
    "You have not been approved yet. Please wait for the administrator to approve your account.",
  ACCOUNT_REJECTED:
    "Your account has not been approved. Please contact the administrator.",
  ACCOUNT_INACTIVE:
    "Your account has been inactivated. Please contact the administrator.",
  GEMINI_QUOTA_EXCEEDED:
    "AI daily limit reached. The Gemini free tier allows a limited number of requests per day — try again tomorrow or check your API usage.",
  GEMINI_UNAVAILABLE:
    "AI service is temporarily busy. Please wait a minute and try again.",
  GEMINI_CONFIG_ERROR:
    "AI is not configured on the server. Ask your administrator to set GEMINI_API_KEY.",
  FILE_TOO_LARGE:
    "File is too large to upload. Try a shorter audio clip or paste the transcript as text instead.",
  UPLOAD_ERROR: "File upload failed. Check the file type and try again.",
};

function normalizeMessage(message) {
  if (!message || typeof message !== "string") {
    return "";
  }
  return message.trim();
}

function inferCodeFromMessage(message) {
  if (/quota exceeded|daily.*limit|429|too many requests/i.test(message)) {
    return "GEMINI_QUOTA_EXCEEDED";
  }
  if (/overloaded|temporarily unavailable|503|high demand/i.test(message)) {
    return "GEMINI_UNAVAILABLE";
  }
  if (/GEMINI_API_KEY|api key.*invalid|api key.*missing/i.test(message)) {
    return "GEMINI_CONFIG_ERROR";
  }
  if (/file too large|LIMIT_FILE_SIZE|413/i.test(message)) {
    return "FILE_TOO_LARGE";
  }
  return null;
}

export function isQuotaError(error) {
  const code = error?.response?.data?.code || inferCodeFromMessage(error?.response?.data?.error || "");
  return code === "GEMINI_QUOTA_EXCEEDED" || error?.response?.status === 429;
}

export function isAuthError(error) {
  return error?.response?.status === 401;
}

export function isNetworkError(error) {
  return (
    !error?.response &&
    (error?.message === "Network Error" ||
      error?.code === "ERR_NETWORK" ||
      error?.code === "ECONNREFUSED")
  );
}

export function isTimeoutError(error) {
  return error?.code === "ECONNABORTED" || /timeout/i.test(error?.message || "");
}

/**
 * Turn API / network errors into a clear user-facing message.
 */
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string") {
    return normalizeMessage(error) || fallback;
  }

  const data = error.response?.data;
  const status = error.response?.status;
  const code = data?.code || inferCodeFromMessage(data?.error || "");

  if (code && CODE_MESSAGES[code]) {
    return CODE_MESSAGES[code];
  }

  const serverMessage = normalizeMessage(data?.error);
  if (serverMessage && serverMessage.length <= 600) {
    const inferred = inferCodeFromMessage(serverMessage);
    if (inferred && CODE_MESSAGES[inferred]) {
      return CODE_MESSAGES[inferred];
    }
    return serverMessage;
  }

  if (isTimeoutError(error)) {
    return "Request timed out. The file may be too large or the server is busy — try a shorter clip or paste the transcript as text.";
  }

  if (isNetworkError(error)) {
    return "Can't reach the server. Check your internet connection and make sure the backend is running.";
  }

  switch (status) {
    case 400:
      return serverMessage || "Invalid request. Please check your input and try again.";
    case 401:
      return serverMessage || "Your session expired. Please sign in again.";
    case 403:
      return serverMessage || "You don't have permission to perform this action.";
    case 404:
      return serverMessage || "The requested item was not found. It may have been deleted.";
    case 413:
      return serverMessage || CODE_MESSAGES.FILE_TOO_LARGE;
    case 429:
      return serverMessage || CODE_MESSAGES.GEMINI_QUOTA_EXCEEDED;
    case 503:
      return serverMessage || CODE_MESSAGES.GEMINI_UNAVAILABLE;
    case 500:
      return serverMessage || fallback;
    default:
      return fallback;
  }
}
