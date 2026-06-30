import { createContext, useContext, useState } from "react";
import {getPayments, getPaymentsSummary, createPayment, deletePayment, updatePayment, editPayment} from "../services/paymentService";
import { toast } from "../lib/toastBus";
import { useTranslation } from "react-i18next";

export const PaymentContext = createContext();

export function PaymentProvider({ children }) {
  const { t } = useTranslation("payment");
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
      setError(t("messages.load_failed"));
      toast.danger(t("messages.load_failed"), t("messages.load_failed_desc"));
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
      toast.danger(t("messages.summary_failed"), t("messages.summary_failed_desc"));
      return null;
    } finally {
      setSummaryLoading(false);
    }
  }

  async function addPayment(data) {
    try {
      await createPayment(data);
      toast.success(t("messages.payment_created"), t("messages.payment_created_desc"));
      return { success: true };
    } catch (err) {
      const fields = err.response?.data?.fields;
      const detail = err.response?.data?.detail;
      const nonFieldError = fields?.non_field_errors?.[0];
      if (nonFieldError) toast.danger(t("messages.create_failed"), nonFieldError);
      return { success: false, errors: fields ?? (detail ? { detail } : {}) };
    }
  }

  async function removePayment(id) {
    try {
      await deletePayment(id);
      setPayments((prev) => prev.filter((p) => p.id !== id));
      toast.success(t("messages.payment_deleted"), t("messages.payment_deleted_desc"));
      return { success: true };
    } catch (err) {
      toast.danger(t("messages.delete_failed"), t("messages.delete_failed_desc"));
      return { success: false };
    }
  }

  async function editPayment(id, data) {
    try {
      await updatePayment(id, data);
      toast.success(t("messages.payment_updated"), t("messages.payment_updated_desc"));
      return { success: true };
    } catch (err) {
      const fields = err.response?.data?.fields;
      const detail = err.response?.data?.detail;
      const nonFieldError = fields?.non_field_errors?.[0];
      if (nonFieldError) toast.danger(t("messages.update_failed"), nonFieldError);
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