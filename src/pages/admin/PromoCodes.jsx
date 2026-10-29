import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { API_URL } from "../../../config";

const emptyForm = {
  code: "",
  description: "",
  discountType: "percent",
  discountValue: "",
  minBookingAmount: "",
  maxUses: "",
  expiresAt: "",
  active: true,
};

const formatDiscount = (promo) =>
  promo.discount_type === "percent"
    ? `${Number(promo.discount_value)}% off`
    : `₱${Number(promo.discount_value).toLocaleString()} off`;

const PromoCodes = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // null = create dialog closed, "new" = create, else = editing that id
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem("token");

  const fetchPromos = () => {
    axios
      .get(`${API_URL}/api/promo-codes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setPromos(res.data))
      .catch((err) => console.error("Error fetching promo codes:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPromos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId("new");
  };

  const openEdit = (promo) => {
    setForm({
      code: promo.code,
      description: promo.description || "",
      discountType: promo.discount_type,
      discountValue: promo.discount_value,
      minBookingAmount: promo.min_booking_amount || "",
      maxUses: promo.max_uses ?? "",
      expiresAt: promo.expires_at ? promo.expires_at.slice(0, 10) : "",
      active: promo.active,
    });
    setEditingId(promo.id);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId === "new") {
        await axios.post(`${API_URL}/api/promo-codes`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Promo code created!");
      } else {
        await axios.put(`${API_URL}/api/promo-codes/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Promo code updated!");
      }
      setEditingId(null);
      fetchPromos();
    } catch (err) {
      console.error("Error saving promo code:", err);
      toast.error(err.response?.data?.message || "Failed to save promo code.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (promo) => {
    Swal.fire({
      title: `Delete "${promo.code}"?`,
      text: "Bookings that already used this code keep their discount -- this only stops future use.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#b23b2e",
      cancelButtonColor: "#6b6259",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (!result.isConfirmed) return;

      axios
        .delete(`${API_URL}/api/promo-codes/${promo.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          toast.success("Promo code deleted.");
          fetchPromos();
        })
        .catch((err) => {
          console.error("Error deleting promo code:", err);
          toast.error("Failed to delete promo code.");
        });
    });
  };

  const toggleActive = (promo) => {
    axios
      .put(
        `${API_URL}/api/promo-codes/${promo.id}`,
        {
          code: promo.code,
          description: promo.description,
          discountType: promo.discount_type,
          discountValue: promo.discount_value,
          minBookingAmount: promo.min_booking_amount,
          maxUses: promo.max_uses,
          expiresAt: promo.expires_at,
          active: !promo.active,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .then(() => fetchPromos())
      .catch((err) => {
        console.error("Error toggling promo code:", err);
        toast.error("Failed to update promo code.");
      });
  };

  const isExpired = (promo) =>
    promo.expires_at && new Date(promo.expires_at) < new Date();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Promo Codes
        </h1>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="size-4" />
          Add Promo Code
        </Button>
      </div>

      {loading ? (
        <p className="mt-6 text-ink/60">Loading...</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/50">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Min. Booking</th>
                <th className="px-4 py-3 font-medium">Usage</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promos.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-6 text-center text-ink/50">
                    No promo codes yet.
                  </td>
                </tr>
              ) : (
                promos.map((promo) => (
                  <tr
                    key={promo.id}
                    className="border-b border-ink/5 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-ink">
                      {promo.code}
                    </td>
                    <td className="px-4 py-3">{formatDiscount(promo)}</td>
                    <td className="px-4 py-3">
                      {Number(promo.min_booking_amount) > 0
                        ? `₱${Number(promo.min_booking_amount).toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {promo.used_count}
                      {promo.max_uses ? ` / ${promo.max_uses}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      {promo.expires_at
                        ? new Date(promo.expires_at).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(promo)}
                        className={
                          !promo.active || isExpired(promo)
                            ? "rounded-full bg-seal/10 px-2.5 py-1 text-xs font-medium text-seal"
                            : "rounded-full bg-lagoon/10 px-2.5 py-1 text-xs font-medium text-lagoon-dark"
                        }
                      >
                        {isExpired(promo)
                          ? "Expired"
                          : promo.active
                            ? "Active"
                            : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(promo)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-seal hover:bg-seal/10 hover:text-seal"
                          onClick={() => handleDelete(promo)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={!!editingId}
        onOpenChange={(open) => !open && setEditingId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId === "new" ? "Add Promo Code" : "Edit Promo Code"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-ink/80">Code</label>
              <div className="mt-1.5">
                <Input
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. SUMMER25"
                  className="uppercase"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-ink/80">
                Description (admin-only note)
              </label>
              <div className="mt-1.5">
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="e.g. Summer promo for social media"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-ink/80">
                  Discount Type
                </label>
                <select
                  value={form.discountType}
                  onChange={(e) =>
                    setForm({ ...form, discountType: e.target.value })
                  }
                  className="border-input mt-1.5 flex h-9 w-full rounded-md border bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  <option value="percent">Percent (%)</option>
                  <option value="fixed">Fixed amount (₱)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-ink/80">
                  Discount Value
                </label>
                <div className="mt-1.5">
                  <Input
                    type="number"
                    min="0"
                    value={form.discountValue}
                    onChange={(e) =>
                      setForm({ ...form, discountValue: e.target.value })
                    }
                    placeholder={
                      form.discountType === "percent" ? "e.g. 15" : "e.g. 500"
                    }
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-ink/80">
                  Min. Booking Amount (optional)
                </label>
                <div className="mt-1.5">
                  <Input
                    type="number"
                    min="0"
                    value={form.minBookingAmount}
                    onChange={(e) =>
                      setForm({ ...form, minBookingAmount: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-ink/80">
                  Max Uses (optional)
                </label>
                <div className="mt-1.5">
                  <Input
                    type="number"
                    min="0"
                    value={form.maxUses}
                    onChange={(e) =>
                      setForm({ ...form, maxUses: e.target.value })
                    }
                    placeholder="Unlimited"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-ink/80">
                Expires On (optional)
              </label>
              <div className="mt-1.5">
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) =>
                    setForm({ ...form, expiresAt: e.target.value })
                  }
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-ink/80">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="accent-lagoon"
              />
              Active
            </label>

            <div className="mt-2 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromoCodes;
