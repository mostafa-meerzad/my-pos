import React, { Suspense } from "react";
import AddDeliveryPage from "./AddDeliveryPage";

export default function Page() {
  return (
    <Suspense>
      <AddDeliveryPage />
    </Suspense>
  );
}