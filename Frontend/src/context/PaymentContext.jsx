import { createContext, useContext, useState } from "react";
import {getPayments, getPaymentsSummary, createPayment, deletePayment, updatePayment, editPayment} from "../services/paymentService";
import { toast } from "../lib/toastBus";

export const PaymentContext = createContext();

export function PaymentProvider({ children }) {
  const [payments, setPayments]   = useState([]);
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError]         = useState("");

  async function listPayments(filters = {}) {
    setLoading(true);
    setError("");
    try {
      const res = await getPayments(filters);
      const data = res.data.results ?? res.data;
      setPayments(data);
      return data;
    } catch (err) {
      setError("Failed to load payments.");
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }

  async function fetchSummary(month = "") {
    setSummaryLoading(true);
    try {
      const res = await getPaymentsSummary(month);
      setSummary(res.data);
      return res.data;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setSummaryLoading(false);
    }
  }

  async function addPayment(data) {
    try {
      await createPayment(data);
      toast.success("Payment created", "A new pending payment has been added.");
      return { success: true };
    } catch (err) {
      const fields = err.response?.data?.fields;
      const detail = err.response?.data?.detail;
      return { success: false, errors: fields ?? (detail ? { detail } : {}) };
    }
  }

  async function removePayment(id) {
    try {
      await deletePayment(id);
      setPayments((prev) => prev.filter((p) => p.id !== id));
      toast.success("Payment deleted", "The payment has been removed.");
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  }

  async function editPayment(id, data) {
    try {
      await updatePayment(id, data);
      toast.success("Payment updated", "Payment status has been updated successfully.");
      return { success: true };
    } catch (err) {
      const fields = err.response?.data?.fields;
      const detail = err.response?.data?.detail;
      return { success: false, errors: fields ?? (detail ? { detail } : {}) };
    }
  }

  return (
    <PaymentContext.Provider
      value={{
        payments,
        summary,
        loading,
        summaryLoading,
        error,
        listPayments,
        fetchSummary,
        addPayment,
        editPayment,
        removePayment,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
}

export const usePayment = () => useContext(PaymentContext);