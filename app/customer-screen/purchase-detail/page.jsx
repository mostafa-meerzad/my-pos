"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import useSaleStore from "@/components/saleStore";

export default function PurchaseDetailPage() {
  const items = useSaleStore((s) => s.items);

  const normalized = useMemo(() => {
    return items.map((it) => {
      const price = Number(it.unitPrice || it.price || 0);
      const qty = Number(it.quantity || 0);
      const discount = Number(it.discount || 0);
      const subtotal = typeof it.subtotal === "number" ? it.subtotal : +(price * qty - discount);
      return { ...it, price, qty, discount, subtotal: +subtotal.toFixed(2) };
    });
  }, [items]);

  const totalItems = normalized.reduce((s, it) => s + it.qty, 0);
  const subtotal = normalized.reduce((s, it) => s + it.price * it.qty, 0);
  const discount = normalized.reduce((s, it) => s + (it.discount || 0), 0);
  const total = +(subtotal - discount).toFixed(2);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
      <h1 className="text-4xl font-bold text-orange-600 mb-6">Purchase Details</h1>
      <Link href="/customer-screen">
          <Button variant="outline">Purchase Completed</Button>
      </Link>
      
      </div>
      <Table>
        <TableHeader>
          <TableRow className={"text-xl"}>
            <TableHead className={"font-bold"}>Product</TableHead>
            <TableHead className={"font-bold"}>Quantity</TableHead>
            <TableHead className={"font-bold"}>Price</TableHead>
            <TableHead className={"font-bold"}>Subtotal</TableHead>
            <TableHead className={"font-bold"}>Expire Date</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {normalized.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-500">Waiting for items...</TableCell>
            </TableRow>
          ) : (
            normalized.map((item, i) => (
              <TableRow key={item.tempId ?? item.id ?? i} className={"text-lg"}>
                <TableCell>{item.name ?? item.product ?? "Unknown"}</TableCell>
                <TableCell>{item.qty}</TableCell>
                <TableCell>${item.price.toFixed(2)}</TableCell>
                <TableCell>${item.subtotal.toFixed(2)}</TableCell>
                <TableCell>{item.expireDate ?? "-"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="mt-8 flex flex-col items-end space-y-2 text-lg font-medium text-orange-600">
        <p>Items: {totalItems}</p>
        <p>Subtotal: ${subtotal.toFixed(2)}</p>
        <p>Discount: ${discount.toFixed(2)}</p>
        <p className="text-xl font-bold">Total: ${total.toFixed(2)}</p>
      </div>
    </div>
  );
}
