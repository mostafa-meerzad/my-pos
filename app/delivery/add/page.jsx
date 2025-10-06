import React, { Suspense } from "react";
import AddDeliveryClient from "./AddDeliveryClient";

export default function Page() {
  return (
    <Suspense>
      <AddDeliveryClient />
    </Suspense>
  );
}