"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Plus, Trash2, Edit, Save } from "lucide-react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import salesImage from "@/assets/sales_img.png";
import useSaleStore from "@/components/saleStore";
import { useReactToPrint } from "react-to-print";
import Invoice from "@/components/Invoice";

export default function AddSalePage() {
  // store actions
  const items = useSaleStore((s) => s.items);
  const addItem = useSaleStore((s) => s.addItem);
  const updateItem = useSaleStore((s) => s.updateItem);
  const deleteItem = useSaleStore((s) => s.deleteItem);
  const clear = useSaleStore((s) => s.clear);
  const addFinalizedSale = useSaleStore((s) => s.addFinalizedSale);

  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  // local states
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [customerQuery, setCustomerQuery] = useState("");
  const [customerSuggestionsVisible, setCustomerSuggestionsVisible] =
    useState(false);

  const [productQuery, setProductQuery] = useState("");
  const [productSuggestionsVisible, setProductSuggestionsVisible] =
    useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [itemDiscount, setItemDiscount] = useState(0);
  const [customer, setCustomer] = useState(null);

  // NEW: payment method + tax
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [taxAmount, setTaxAmount] = useState(0);

  // editing
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState(null);

  // invoice
  const invoiceRef = useRef(null);
  const barcodeRef = useRef(null);
  const handlePrint = useReactToPrint({ contentRef: invoiceRef });

  // loading state for finalizing
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  // 🔹 fetch customers
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetch("/api/customer/");
        const data = await res.json();
        if (data.success) {
          setCustomers(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch customers", err);
      }
    }
    fetchCustomers();
  }, []);

  //for barcode focus on page load
  useEffect(() => {
  if (barcodeRef.current) {
    barcodeRef.current.focus();
  }
}, []);

  // 🔹 fetch products
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products/");
        const data = await res.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch products", err);
      }
    }
    fetchProducts();
  }, []);

  // product suggestions
  const productSuggestions = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return [];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  }, [productQuery, products]);

  // quick barcode lookup
  useEffect(() => {
    if (!barcodeInput) return;
    const f = products.find((p) => p.barcode === barcodeInput.trim());
    if (f) {
      setSelectedProduct(f);
      setProductQuery(f.name);
    }
  }, [barcodeInput, products]);

  // customer suggestions
  const customerSuggestions = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return [];
    return customers.filter((c) => c.name.toLowerCase().includes(q));
  }, [customerQuery, customers]);

  // add item
  function genTempId() {
    return `item-${crypto.randomUUID()}`;
  }

  function onAdd() {
    if (!selectedProduct) {
      alert("Select product or scan barcode");
      return;
    }
    if (!quantity || quantity <= 0) {
      alert("Quantity must be at least 1");
      return;
    }
    const unitPrice = Number(selectedProduct.price || 0);
    const discount = Number(itemDiscount || 0);
    const subtotal = +(unitPrice * quantity - discount);

    const item = {
      tempId: genTempId(),
      productId: selectedProduct.id,
      name: selectedProduct.name,
      barcode: selectedProduct.barcode,
      unitPrice,
      quantity,
      discount,
      subtotal: +subtotal.toFixed(2),
    };

    addItem(item);
    // reset
    setProductQuery("");
    setSelectedProduct(null);
    setBarcodeInput("");
    setQuantity(1);
    setItemDiscount(0);
  }

  // edit item
  function startEdit(row) {
    setEditingId(row.tempId);
    setEditValues({ ...row });
  }

  function saveEdit() {
    if (!editingId || !editValues) return;
    const updated = {
      ...editValues,
      subtotal: +(
        Number(editValues.unitPrice || 0) * Number(editValues.quantity || 0) -
        Number(editValues.discount || 0)
      ).toFixed(2),
    };
    updateItem(editingId, updated);
    setEditingId(null);
    setEditValues(null);
  }

  // totals
  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (s, it) => s + Number(it.unitPrice || 0) * Number(it.quantity || 0),
      0
    );
    const discount = items.reduce((s, it) => s + Number(it.discount || 0), 0);
    const tax = 0;
    const final = +(subtotal - discount + tax).toFixed(2);
    return {
      subtotal: +subtotal.toFixed(2),
      discount: +discount.toFixed(2),
      final,
    };
  }, [items]);

  // submit to server
  async function handleFinalizeSale() {
    if (items.length === 0) return alert("No items to finalize");
    if (isSubmitting) return;

    // prepare payload in the shape your API expects
    const payload = {
      customerId: customer?.id ?? null, // null -> backend will create/get Walk-in
      paymentMethod: paymentMethod || "cash",
      taxAmount: Number(taxAmount || 0),
      items: items.map((it) => ({
        productId: it.productId,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        discount: Number(it.discount || 0),
        subtotal: Number(it.subtotal),
      })),
      totalAmount: Number((totals.final + Number(taxAmount || 0)).toFixed(2)),
    };

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // show server error (either validation, business rule or generic)
        const message =
          (data && data.error) ||
          (data && data.errors) ||
          "Failed to create sale. See console for details.";
        console.error("Sale error:", data);
        alert(typeof message === "string" ? message : JSON.stringify(message));
        return;
      }

      // success — server returns created sale in data.data
      // push to local finalizedSales for history
      const serverSale = data.data || {};
      const localSale = {
        id: serverSale.id ?? Date.now(),
        customer: customer ?? { id: 0, name: "Walk in" },
        items: items,
        total: payload.totalAmount,
        date: new Date().toISOString(),
        serverSale,
      };
      addFinalizedSale(localSale);

      // clear UI
      clear();
      setCustomer(null);
      setCustomerQuery("");
      setPaymentMethod("cash");
      setTaxAmount(0);

      alert("Sale finalized and saved successfully!");
    } catch (err) {
      console.error("Failed to finalize sale:", err);
      alert("Network or unexpected error. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  }
  // submit to server and go to delivery component
  async function handleFinalizeSaleWithDelivery() {
  if (items.length === 0) return alert("No items to finalize");
  if (isSubmitting) return;

  const payload = {
    customerId: customer?.id ?? null,
    paymentMethod: paymentMethod || "cash",
    taxAmount: Number(taxAmount || 0),
    items: items.map((it) => ({
      productId: it.productId,
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      discount: Number(it.discount || 0),
      subtotal: Number(it.subtotal),
    })),
    totalAmount: Number((totals.final + Number(taxAmount || 0)).toFixed(2)),
  };

  setIsSubmitting(true);
  try {
    const res = await fetch("/api/sale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      console.error("Sale error:", data);
      alert(data?.error || "Failed to create sale");
      return;
    }

    // success — server returns created sale in data.data
      // push to local finalizedSales for history
      const serverSale = data.data || {};
      const localSale = {
        id: serverSale.id ?? Date.now(),
        customer: customer ?? { id: 0, name: "Walk in" },
        items: items,
        total: payload.totalAmount,
        date: new Date().toISOString(),
        serverSale,
      };
      addFinalizedSale(localSale);

      // clear UI
      clear();
      setCustomer(null);
      setCustomerQuery("");
      setPaymentMethod("cash");
      setTaxAmount(0);

    // ✅ redirect to delivery with sale + customer prefilled
    router.push(
      `/delivery/add?saleId=${serverSale.id}&customerId=${serverSale.customerId}`
    );
  } catch (err) {
    console.error("Finalize sale + delivery error:", err);
    alert("Network or unexpected error");
  } finally {
    setIsSubmitting(false);
  }
}


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Image src={salesImage} width={80} height={80} alt="sales" />
          New Sale
        </h1>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              if (confirm("Clear cart?")) clear();
            }}
          >
            Clear
          </Button>
          <Button
            onClick={handleFinalizeSale}
            className={"bg-green-500 text-md"}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Finalize Sale"}
          </Button>
          <Button
            onClick={handleFinalizeSaleWithDelivery}
            className="bg-orange-500 text-md"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Finalize Sale + Delivery"}
          </Button>

          <Button onClick={handlePrint} className="bg-blue-500 text-md">
            Print Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left Panel */}
        <Card>
          <CardContent>
            {/* Customer */}
            <h3 className="text-lg font-semibold mb-3">Customer</h3>
            <Input
              placeholder="Search customer..."
              value={customerQuery}
              onChange={(e) => {
                setCustomerQuery(e.target.value);
                setCustomerSuggestionsVisible(true);
              }}
              onFocus={() => setCustomerSuggestionsVisible(true)}
              onBlur={() =>
                setTimeout(() => setCustomerSuggestionsVisible(false), 150)
              }
            />
            <div className="mt-2 text-sm text-gray-600">
              Selected: {customer?.name || "Walk in"}
            </div>

            {customerSuggestionsVisible &&
              customerQuery &&
              customerSuggestions.length > 0 && (
                <div className="absolute z-20 bg-white border rounded w-md mt-1 max-h-40 overflow-auto">
                  {customerSuggestions.map((c) => (
                    <div
                      key={c.id}
                      className="p-2 hover:bg-slate-50 cursor-pointer"
                      onMouseDown={() => {
                        setCustomer(c);
                        setCustomerQuery(c.name);
                        setCustomerSuggestionsVisible(false);
                      }}
                    >
                      {c.name}
                    </div>
                  ))}
                </div>
              )}

            {/* Product */}
            <h3 className="text-lg font-semibold mb-3 mt-5">Add product</h3>
            <Input
             ref={barcodeRef}
              placeholder="Scan barcode"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="mb-2"
            />
            <Input
              placeholder="Search product..."
              value={productQuery}
              onChange={(e) => {
                setProductQuery(e.target.value);
                setProductSuggestionsVisible(true);
              }}
              onFocus={() => setProductSuggestionsVisible(true)}
              onBlur={() =>
                setTimeout(() => setProductSuggestionsVisible(false), 150)
              }
              className="mb-2"
            />

            {productSuggestionsVisible &&
              productQuery &&
              productSuggestions.length > 0 && (
                <div className="mb-2 max-h-36 overflow-auto border rounded bg-white">
                  {productSuggestions.map((p) => (
                    <div
                      key={p.id}
                      className="p-2 hover:bg-slate-50 cursor-pointer"
                      onMouseDown={() => {
                        setSelectedProduct(p);
                        setProductQuery(p.name);
                        setBarcodeInput(p.barcode);
                        setProductSuggestionsVisible(false);
                      }}
                    >
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-gray-500">
                        {p.barcode} • ${p.price}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            {/* Qty + Discount */}
            <div className="flex items-center gap-2 mt-3">
              <div className="w-28">
                <label className="text-xs text-gray-600">Qty</label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
              <div className="w-32">
                <label className="text-xs text-gray-600">Discount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={itemDiscount}
                  onChange={(e) => setItemDiscount(Number(e.target.value))}
                />
              </div>
              <div className="flex-1" />
            </div>

            {selectedProduct && (
              <div className="mt-3 text-sm text-gray-600">
                Selected: <strong>{selectedProduct.name}</strong> • $
                {selectedProduct.price}
              </div>
            )}

            {/* Payment method + Tax */}
            <div className="flex items-center gap-2 mt-3">
              {/* Custom Payment Method Dropdown */}
              <div className="w-28 relative">
                <label className="text-xs text-gray-600">Payment method</label>
                <div
                  className="mt-1 p-2 border rounded bg-white cursor-pointer"
                  onClick={() => setShowPaymentOptions(!showPaymentOptions)}
                >
                  {paymentMethod ? (
                    <span className="text-sm">{paymentMethod}</span>
                  ) : (
                    <span className="text-sm text-gray-400">
                      Select method...
                    </span>
                  )}
                </div>

                {showPaymentOptions && (
                  <div className="absolute z-10 mt-1 w-full max-h-36 overflow-auto border rounded bg-white shadow">
                    {["Cash", "Card", "Mobile", "Other"].map((method) => (
                      <div
                        key={method}
                        className="p-2 hover:bg-slate-50 cursor-pointer text-sm"
                        onMouseDown={() => {
                          setPaymentMethod(method);
                          setShowPaymentOptions(false);
                        }}
                      >
                        {method}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tax Amount */}
              <div className="w-32">
                <label className="text-xs text-gray-600">Tax amount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(Number(e.target.value))}
                />
              </div>

              <div className="flex-1" />
            </div>

            <div className="mt-3 flex justify-end">
              <Button onClick={onAdd} className="flex items-center gap-2">
                <Plus className="!w-7 h-7" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel (unchanged) */}
        <div className="md:col-span-2">
          <Card>
            <CardContent>
              <h3 className="text-lg font-semibold mb-3">Items</h3>

              {/* ... rest of your table (unchanged) ... */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-gray-500"
                      >
                        No items
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((row) => (
                      <TableRow key={row.tempId}>
                        <TableCell>
                          {editingId === row.tempId ? (
                            <Input
                              value={editValues?.name || ""}
                              onChange={(e) =>
                                setEditValues((s) => ({
                                  ...(s || {}),
                                  name: e.target.value,
                                }))
                              }
                            />
                          ) : (
                            <div>
                              <div className="font-medium">{row.name}</div>
                              <div className="text-xs text-gray-500">
                                {row.barcode}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === row.tempId ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={String(
                                editValues?.unitPrice ?? row.unitPrice
                              )}
                              onChange={(e) =>
                                setEditValues((s) => ({
                                  ...(s || {}),
                                  unitPrice: Number(e.target.value),
                                }))
                              }
                            />
                          ) : (
                            "$" + Number(row.unitPrice).toFixed(2)
                          )}
                        </TableCell>
                        <TableCell className="w-28">
                          {editingId === row.tempId ? (
                            <Input
                              type="number"
                              value={String(
                                editValues?.quantity ?? row.quantity
                              )}
                              onChange={(e) =>
                                setEditValues((s) => ({
                                  ...(s || {}),
                                  quantity: Number(e.target.value),
                                }))
                              }
                            />
                          ) : (
                            row.quantity
                          )}
                        </TableCell>
                        <TableCell className="w-32">
                          {editingId === row.tempId ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={String(
                                editValues?.discount ?? row.discount
                              )}
                              onChange={(e) =>
                                setEditValues((s) => ({
                                  ...(s || {}),
                                  discount: Number(e.target.value),
                                }))
                              }
                            />
                          ) : (
                            "$" + Number(row.discount || 0).toFixed(2)
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === row.tempId
                            ? "$" +
                              (
                                Number(editValues?.unitPrice || 0) *
                                  Number(editValues?.quantity || 0) -
                                Number(editValues?.discount || 0)
                              ).toFixed(2)
                            : "$" + Number(row.subtotal).toFixed(2)}
                        </TableCell>
                        <TableCell className="w-36">
                          {editingId === row.tempId ? (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={saveEdit}>
                                <Save className="w-4 h-4" /> Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingId(null);
                                  setEditValues(null);
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => startEdit(row)}>
                                <Edit className="w-4 h-4" /> Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteItem(row.tempId)}
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="mt-4 flex justify-end gap-4">
                <div className="bg-slate-50 p-3 rounded border text-right">
                  <div className="text-sm text-gray-600">
                    Subtotal: ${totals.subtotal.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Discounts: -${totals.discount.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Tax: ${Number(taxAmount || 0).toFixed(2)}
                  </div>
                  <div className="text-xl font-semibold mt-1">
                    Total: ${(totals.final + Number(taxAmount || 0)).toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* invoice:  */}
      <div className="hidden">
        <Invoice
          ref={invoiceRef}
          items={items}
          customer={customer}
          totals={totals}
        />
      </div>
    </div>
  );
}
