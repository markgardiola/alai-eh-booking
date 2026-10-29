import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard,
  Users,
  Hotel,
  ClipboardList,
  MessageSquareText,
  BadgeAlert,
  BadgePercent,
} from "lucide-react";
import SidebarShell from "./SidebarShell";
import { cn } from "@/lib/utils";
import { API_URL } from "../../config";

const navItems = [
  {
    to: "/adminDashboard",
    end: true,
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  { to: "/adminDashboard/users", label: "User Management", icon: Users },
  { to: "/adminDashboard/resorts", label: "Resort Listings", icon: Hotel },
  {
    to: "/adminDashboard/bookings",
    label: "Booking Requests",
    icon: ClipboardList,
    badgeKey: "gcashPending",
  },
  {
    to: "/adminDashboard/refund-requests",
    label: "Refund Requests",
    icon: BadgeAlert,
    badgeKey: "refundRequests",
  },
  {
    to: "/adminDashboard/promo-codes",
    label: "Promo Codes",
    icon: BadgePercent,
  },
  {
    to: "/adminDashboard/feedbacks",
    label: "Customer Feedback",
    icon: MessageSquareText,
  },
];

const POLL_INTERVAL_MS = 30000;

const AdminSideBar = ({ open, onClose }) => {
  const [refundRequestCount, setRefundRequestCount] = useState(0);
  const [gcashPendingCount, setGcashPendingCount] = useState(0);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchCounts = () => {
      axios
        .get(`${API_URL}/api/bookings/refund-requests/count`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setRefundRequestCount(res.data.count))
        .catch((err) =>
          console.error("Error fetching refund request count:", err),
        );

      // GCash bookings sit Pending until an admin manually checks the
      // uploaded receipt -- unlike PayPal, which auto-confirms -- so this
      // flags the ones that genuinely need attention. It clears itself
      // once approved (-> Confirmed).
      axios
        .get(`${API_URL}/api/bookings/gcash-pending/count`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setGcashPendingCount(res.data.count))
        .catch((err) =>
          console.error("Error fetching GCash pending count:", err),
        );
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [token]);

  const badgeCounts = {
    refundRequests: refundRequestCount,
    gcashPending: gcashPendingCount,
  };

  return (
    <SidebarShell open={open} onClose={onClose}>
      <div className="flex items-center gap-2.5 p-4">
        <img
          src="/images/logo.png"
          alt=""
          className="h-9 w-9 shrink-0 rounded-full"
        />
        <span className="font-display text-lg font-semibold text-sand-light">
          ALAI-eh
        </span>
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
        {navItems.map(({ to, end, label, icon, badgeKey }) => {
          const Icon = icon;
          const badgeCount = badgeKey ? badgeCounts[badgeKey] : 0;
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-lagoon text-sand-light"
                    : "text-sand-light/60 hover:bg-white/5 hover:text-sand-light",
                )
              }
            >
              <Icon className="size-5 shrink-0" />
              <span className="flex-1">{label}</span>
              {badgeCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-seal text-[11px] font-semibold text-white">
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </SidebarShell>
  );
};

export default AdminSideBar;
