'use client'

import Lottie from "lottie-react";
import loadingAnimation from "@/my_source/loading.json";

export default function PageLoader() {
  return (
    <div className="fixed inset-0 bg-[#909C90] flex items-center justify-center z-50">
      <div className="w-48 h-48">
        <Lottie animationData={loadingAnimation} loop={true} />
      </div>
    </div>
  );
}
