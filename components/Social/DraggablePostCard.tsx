"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
// import { CSS } from "@dnd-kit/utilities"; // Unused now
import { PostCard, PostData } from "./PostCard";

interface DraggablePostCardProps {
  post: PostData;
  onLoginRequired: () => void;
  isOwner?: boolean;
  className?: string;
}

export function DraggablePostCard({
  post,
  onLoginRequired,
  isOwner = false,
  className = "",
}: DraggablePostCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: post.id,
    disabled: !isOwner,
  });

  const style = {
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`touch-none ${className}`}
    >
      <PostCard post={post} onLoginRequired={onLoginRequired} />
    </div>
  );
}
