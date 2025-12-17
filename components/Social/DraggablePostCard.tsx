"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
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
  const { attributes, listeners, setNodeRef, isDragging, transform } =
    useDraggable({
      id: post.id,
      disabled: !isOwner,
    });

  const style = {
    opacity: isDragging ? 0.3 : 1,
    transform: CSS.Translate.toString(transform),
  };

  // Apply drag listeners to owner's posts, but remove touch-none to allow scrolling
  const dragProps = isOwner ? { ...attributes, ...listeners } : {};

  return (
    <div ref={setNodeRef} style={style} {...dragProps} className={className}>
      <PostCard post={post} onLoginRequired={onLoginRequired} />
    </div>
  );
}
