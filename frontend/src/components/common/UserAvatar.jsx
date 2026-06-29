import React, { useEffect, useState } from "react";
import { fetchAvatarBlobUrl } from "../../services/api";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function UserAvatar({ user, size = "md", className = "", refreshKey = 0 }) {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    let active = true;
    let objectUrl = null;

    const loadAvatar = async () => {
      if (!user?.hasAvatar) {
        setBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        return;
      }

      try {
        const cacheKey = user.updatedAt
          ? new Date(user.updatedAt).getTime()
          : refreshKey || Date.now();
        objectUrl = await fetchAvatarBlobUrl(cacheKey);
        if (active) {
          setBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return objectUrl;
          });
        } else if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      } catch {
        if (active) {
          setBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
          });
        }
      }
    };

    loadAvatar();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [user?.hasAvatar, user?.updatedAt, refreshKey]);

  const sizeClass = `user-avatar-${size}`;
  const wrapClasses = ["user-avatar-wrap", sizeClass, className].filter(Boolean).join(" ");

  if (blobUrl) {
    return (
      <span className={wrapClasses}>
        <img
          src={blobUrl}
          alt={user?.name ? `${user.name}'s profile` : "Profile"}
          className="user-avatar-img"
        />
      </span>
    );
  }

  return (
    <span className={`user-avatar user-avatar-fallback ${sizeClass} ${className}`.trim()} aria-hidden={!user?.name}>
      {getInitials(user?.name)}
    </span>
  );
}

export default UserAvatar;
