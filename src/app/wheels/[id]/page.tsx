import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import WheelClientWrapper from "./WheelClientWrapper";
import Header from "@/components/Header";
import { WheelIcon, PencilIcon } from "@/components/Icons";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const wheel = await db.wheel.findUnique({ where: { id } });
  return {
    title: wheel ? `Vòng quay ${wheel.name} - Lucky Wheel Hub` : "Vòng quay - Lucky Wheel Hub"
  };
}

export default async function WheelDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  // Fetch wheel config
  const wheel = await db.wheel.findUnique({
    where: { id },
    include: {
      user: {
        select: { username: true }
      }
    }
  });

  // If wheel doesn't exist or is soft-deleted, return 404
  if (!wheel || wheel.isDeleted) {
    notFound();
  }

  const credit = user && user.role !== "admin" ? await db.spinCodeRedemption.aggregate({ where: { userId: user.id }, _sum: { remaining: true } }) : null;

  let parsedSlices = [];
  try {
    parsedSlices = JSON.parse(wheel.slices);
  } catch (e) {
    console.error("Failed to parse slices JSON:", e);
  }

  const isOwnerOrAdmin = user && (user.id === wheel.userId || user.role === "admin");

  return (
    <div className="app-container">
      {/* Header breadcrumb */}
      <Header user={user} />

      {/* Main Wheel Client Container */}
      <WheelClientWrapper 
        wheelId={wheel.id}
        wheelName={wheel.name}
        creatorName={wheel.user.username}
        slices={parsedSlices}
        currentUser={user}
        customWinnerId={wheel.customWinnerId}
        hideOnWin={wheel.hideOnWin}
        backgroundImage={wheel.backgroundImage}
        initialUpdatedAt={wheel.updatedAt.toISOString()}
        initialCredits={credit?._sum.remaining ?? 0}
      />
    </div>
  );
}
