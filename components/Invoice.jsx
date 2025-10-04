"use client";

import React, { forwardRef } from "react";

const Invoice = forwardRef(({ items, customer, totals, saleId, date }, ref) => {
  return (
    <div ref={ref} className="p-6 w-[80mm] text-sm font-mono">
      <h2 className="text-center text-lg font-bold">My Shop</h2>
      <p className="text-center text-xs mb-2">Invoice #{saleId}</p>
      <p className="text-xs">Customer: {customer?.name || "Walk-in"}</p>
      <p className="text-xs mb-2">Date: {date}</p>

      <table className="w-full border-t border-b text-xs my-2">
        <thead>
          <tr className="border-b">
            <th className="text-left">Item</th>
            <th className="text-right">Qty</th>
            <th className="text-right">Price</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.tempId}>
              <td>{it.name}</td>
              <td className="text-right">{it.quantity}</td>
              <td className="text-right">${it.unitPrice.toFixed(2)}</td>
              <td className="text-right">${it.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-2 space-y-1">
        <div className="flex justify-between text-xs">
          <span>Subtotal:</span>
          <span>${totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Discount:</span>
          <span>-${totals.discount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>${totals.final.toFixed(2)}</span>
        </div>
      </div>

      <p className="text-center text-xs mt-4">Thank you for shopping!</p>
    </div>
  );
});

Invoice.displayName = "Invoice";

export default Invoice;
