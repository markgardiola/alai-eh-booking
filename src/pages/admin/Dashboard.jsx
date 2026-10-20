import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Users,
  Hotel,
  CalendarCheck,
  Wallet,
  HandCoins,
  BadgeAlert,
  BadgePercent,
  Star,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/StatusBadge";
import StarRating from "@/components/StarRating";
import { API_URL } from "../../../config";

const RANGE_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

const STATUS_COLORS = {
  Confirmed: "#3e9c93",
  Pending: "#d9c9a6",
  Cancelled: "#b23b2e",
  "Refund Requested": "#1b1b18",
};

const peso = (n) => `₱${Number(n || 0).toLocaleString()}`;

const Dashboard = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rateInput, setRateInput] = useState("");
  const [savingRate, setSavingRate] = useState(false);
  const token = localStorage.getItem("token");

  const fetchAnalytics = () => {
    setLoading(true);
    axios
      .get(`${API_URL}/api/admin/analytics?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setData(res.data);
        setRateInput(String(res.data.commissionRate));
      })
      .catch((err) => console.error("Error fetching analytics:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const handleSaveRate = () => {
    setSavingRate(true);
    axios
      .put(
        `${API_URL}/api/admin/settings/commission-rate`,
        { rate: rateInput },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .then(() => {
        toast.success("Commission rate updated!");
        fetchAnalytics();
      })
      .catch((err) => {
        console.error("Error updating commission rate:", err);
        toast.error(err.response?.data?.message || "Failed to update rate.");
      })
      .finally(() => setSavingRate(false));
  };

  if (loading && !data) {
    return <p className="text-ink/60">Loading dashboard...</p>;
  }
  if (!data) {
    return <p className="text-ink/60">Failed to load dashboard data.</p>;
  }

  const {
    kpis,
    revenueOverTime,
    bookingsByStatus,
    stayTypeBreakdown,
    topResorts,
    promoUsage,
    reviewSummary,
    lowRatedResorts,
    recentBookings,
    recentReviews,
  } = data;

  const kpiCards = [
    {
      label: "Registered Users",
      value: kpis.totalUsers,
      icon: Users,
      to: "/adminDashboard/users",
      accent: "bg-ink/10 text-ink",
    },
    {
      label: "Resorts",
      value: kpis.totalResorts,
      icon: Hotel,
      to: "/adminDashboard/resorts",
      accent: "bg-ink/10 text-ink",
    },
    {
      label: `Bookings (${days}d)`,
      value: kpis.bookingsInRange,
      icon: CalendarCheck,
      to: "/adminDashboard/bookings",
      accent: "bg-lagoon/10 text-lagoon-dark",
    },
    {
      label: "Bookings (all time)",
      value: kpis.totalBookingsAllTime,
      icon: CalendarCheck,
      to: "/adminDashboard/bookings",
      accent: "bg-ink/10 text-ink",
    },
    {
      label: "Pending GCash Approval",
      value: kpis.pendingGcashCount,
      icon: BadgeAlert,
      to: "/adminDashboard/bookings",
      accent: "bg-seal/10 text-seal",
    },
    {
      label: "Refund Requests",
      value: kpis.refundRequestCount,
      icon: BadgeAlert,
      to: "/adminDashboard/refund-requests",
      accent: "bg-seal/10 text-seal",
    },
    {
      label: `Gross Revenue (${days}d)`,
      value: peso(kpis.grossRevenueInRange),
      icon: Wallet,
      accent: "bg-lagoon/10 text-lagoon-dark",
    },
    {
      label: `ALAI-eh Revenue (${days}d)`,
      value: peso(kpis.alaiehRevenueInRange),
      icon: HandCoins,
      accent: "bg-lagoon/15 text-lagoon-dark",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Dashboard
        </h1>
        <div className="flex gap-1.5 rounded-full bg-white p-1 shadow-sm">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                days === opt.value
                  ? "bg-lagoon text-white"
                  : "text-ink/60 hover:bg-sand"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const content = (
            <Card className="p-5">
              <div
                className={`inline-flex size-9 items-center justify-center rounded-full ${card.accent}`}
              >
                <Icon className="size-5" />
              </div>
              <p className="mt-3 text-sm text-ink/60">{card.label}</p>
              <p className="mt-0.5 font-display text-2xl font-semibold text-ink">
                {card.value}
              </p>
            </Card>
          );
          return card.to ? (
            <Link key={card.label} to={card.to} className="block">
              {content}
            </Link>
          ) : (
            <div key={card.label}>{content}</div>
          );
        })}
      </div>

      {/* Commission rate setting */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              Platform Commission Rate
            </h2>
            <p className="mt-1 text-sm text-ink/60">
              The % ALAI-eh keeps from each confirmed booking. The rest is owed
              to the resort owner.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              max="100"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              className="w-24"
            />
            <span className="text-ink/60">%</span>
            <Button onClick={handleSaveRate} disabled={savingRate}>
              {savingRate ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Revenue over time */}
      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold text-ink">
          Revenue Over Time
        </h2>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1b1b1810" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₱${v}`} />
              <Tooltip formatter={(v) => peso(v)} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3e9c93"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bookings by status */}
        <Card className="p-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            Bookings by Status
          </h2>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bookingsByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ status, count }) => `${status}: ${count}`}
                >
                  {bookingsByStatus.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] || "#6b6259"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Stay type popularity */}
        <Card className="p-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            Stay Type Popularity
          </h2>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stayTypeBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1b1b1810" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v, name) => (name === "revenue" ? peso(v) : v)}
                />
                <Bar dataKey="bookings" fill="#3e9c93" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top resorts */}
        <Card className="p-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            Top Resorts ({days}d)
          </h2>
          {topResorts.length === 0 ? (
            <p className="mt-3 text-sm text-ink/50">
              No bookings yet in this range.
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {topResorts.map((r, i) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg bg-sand-light px-3 py-2 text-sm"
                >
                  <span className="text-ink">
                    <span className="mr-2 text-ink/40">#{i + 1}</span>
                    {r.name}
                  </span>
                  <span className="text-right">
                    <span className="font-medium text-lagoon-dark">
                      {peso(r.revenue)}
                    </span>
                    <span className="ml-2 text-ink/50">
                      {r.bookings} bookings
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Promo usage */}
        <Card className="p-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            Promo Code Usage ({days}d)
          </h2>
          {promoUsage.length === 0 ? (
            <p className="mt-3 text-sm text-ink/50">
              No promo codes used in this range.
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {promoUsage.map((p) => (
                <div
                  key={p.code}
                  className="flex items-center justify-between rounded-lg bg-sand-light px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-1.5 text-ink">
                    <BadgePercent className="size-3.5 text-lagoon-dark" />
                    {p.code}
                  </span>
                  <span className="text-right">
                    <span className="text-seal">-{peso(p.total_discount)}</span>
                    <span className="ml-2 text-ink/50">{p.uses} uses</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent bookings */}
        <Card className="p-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            Recent Bookings
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            {recentBookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-lg bg-sand-light px-3 py-2 text-sm"
              >
                <div>
                  <p className="text-ink">
                    {b.guest_name} · {b.resort_name}
                  </p>
                  <p className="text-xs text-ink/50">{b.created_at_display}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </Card>

        {/* Reviews summary */}
        <Card className="p-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            Reviews
          </h2>
          <div className="mt-2 flex items-center gap-2">
            <StarRating value={reviewSummary.average} size="sm" />
            <span className="text-sm text-ink/60">
              {Number(reviewSummary.average).toFixed(1)} average ·{" "}
              {reviewSummary.count} review{reviewSummary.count === 1 ? "" : "s"}
            </span>
          </div>

          {lowRatedResorts.length > 0 && (
            <>
              <p className="mt-4 text-sm font-medium text-ink/80">
                Resorts needing attention
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {lowRatedResorts.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg bg-seal/5 px-3 py-2 text-sm"
                  >
                    <span className="text-ink">{r.name}</span>
                    <span className="flex items-center gap-1 text-seal">
                      <Star className="size-3.5 fill-seal text-seal" />
                      {Number(r.average).toFixed(1)} ({r.count})
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {recentReviews.length > 0 && (
            <>
              <p className="mt-4 text-sm font-medium text-ink/80">
                Latest reviews
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {recentReviews.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-lg bg-sand-light px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-ink">{r.resort_name}</span>
                      <StarRating value={r.rating} size="sm" />
                    </div>
                    {r.comment && (
                      <p className="mt-1 text-xs text-ink/60">"{r.comment}"</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
