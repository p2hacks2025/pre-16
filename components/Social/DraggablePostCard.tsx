"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { PostCard, PostData } from "./PostCard";

interface DraggablePostCardProps {
  post: PostData;
  onLoginRequired: () => void;
}

export function DraggablePostCard({
  post,
  onLoginRequired,
}: DraggablePostCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: post.id,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : undefined,
    position: isDragging ? ("relative" as const) : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none"
    >
      <PostCard post={post} onLoginRequired={onLoginRequired} />
    </div>
  );
}
