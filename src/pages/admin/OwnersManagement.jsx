import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { Trash2, User, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/LoadingButton";
import useSingleFlight from "@/hooks/useSingleFlight";
import IconInput from "@/components/IconInput";
import SearchInput from "@/components/SearchInput";
import Pagination from "@/components/Pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { allWordsIn } from "@/lib/search";
import { API_URL } from "../../../config";

const OwnersManagement = () => {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingOwner, setEditingOwner] = useState(null);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [runSave, saving] = useSingleFlight();
  const [runDelete, deleting] = useSingleFlight();
  const [deletingId, setDeletingId] = useState(null);
  const ownersPerPage = 10;

  const token = localStorage.getItem("token");
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchOwners = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/owners`, authHeaders);
      setOwners(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch resort owners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditChange = (e) =>
    setEditingOwner({ ...editingOwner, [e.target.name]: e.target.value });

  const handleEditSubmit = () =>
    runSave(async () => {
      try {
        await axios.put(
          `${API_URL}/api/owners/${editingOwner.id}`,
          {
            username: editingOwner.username,
            email: editingOwner.email,
            password: editingOwner.password,
          },
          authHeaders,
        );
        toast.success("Owner updated successfully!");
        setEditingOwner(null);
        fetchOwners();
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "Failed to update owner.");
      }
    });

  const handleDeleteOwner = (ownerId) =>
    runDelete(async () => {
      setDeletingId(ownerId);
      try {
        await axios.delete(`${API_URL}/api/owners/${ownerId}`, authHeaders);
        toast.success("Owner deleted successfully!");
        fetchOwners();
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "Failed to delete owner.");
      } finally {
        setDeletingId(null);
      }
    });

  const confirmDelete = (owner) => {
    if (owner.resort_count > 0) {
      Swal.fire({
        icon: "info",
        title: "This owner still has resorts",
        text: `${owner.username} owns ${owner.resort_count} resort${owner.resort_count > 1 ? "s" : ""} (${owner.resort_names.join(", ")}). Reassign or delete ${owner.resort_count > 1 ? "them" : "it"} first.`,
        confirmButtonColor: "#3e9c93",
      });
      return;
    }
    Swal.fire({
      title: "Are you sure?",
      text: "This owner account will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#b23b2e",
      cancelButtonColor: "#6b6259",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) handleDeleteOwner(owner.id);
    });
  };

  const filteredOwners = owners.filter((o) =>
    allWordsIn(query, o.username, o.email, (o.resort_names || []).join(" ")),
  );
  const totalPages = Math.ceil(filteredOwners.length / ownersPerPage);
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const indexOfFirstOwner = (safePage - 1) * ownersPerPage;
  const currentOwners = filteredOwners.slice(
    indexOfFirstOwner,
    indexOfFirstOwner + ownersPerPage,
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">
        Resort Owners
      </h1>
      <p className="mt-1 text-sm text-ink/60">
        Owner accounts are created automatically when a resort is added with a
        new owner email.
      </p>

      <div className="mt-4">
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v);
            setCurrentPage(1);
          }}
          placeholder="Search username, email, or resort"
        />
      </div>

      {loading ? (
        <p className="mt-6 text-ink/60">Loading owners...</p>
      ) : error ? (
        <p className="mt-6 text-seal">{error}</p>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/50">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Username</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Resorts</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentOwners.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-4 py-6 text-center text-ink/50"
                    >
                      {query
                        ? "No owners match your search."
                        : "No resort owners yet."}
                    </td>
                  </tr>
                ) : (
                  currentOwners.map((owner, index) => (
                    <tr
                      key={owner.id}
                      className="border-b border-ink/5 last:border-0"
                    >
                      <td className="px-4 py-3">
                        {indexOfFirstOwner + index + 1}
                      </td>
                      <td className="px-4 py-3">{owner.username}</td>
                      <td className="px-4 py-3">{owner.email}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-ink">
                          {owner.resort_count}
                        </span>
                        {owner.resort_count > 0 && (
                          <span className="block max-w-[240px] truncate text-xs text-ink/50">
                            {owner.resort_names.join(", ")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setEditingOwner({ ...owner, password: "" })
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-seal hover:bg-seal/10 hover:text-seal"
                            disabled={deleting}
                            onClick={() => confirmDelete(owner)}
                          >
                            {deletingId === owner.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      <Dialog
        open={!!editingOwner}
        onOpenChange={(open) => !open && setEditingOwner(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Resort Owner</DialogTitle>
            <DialogDescription>
              Changing the email also updates it on this owner's resorts. They
              will need the new email to sign in.
            </DialogDescription>
          </DialogHeader>

          {editingOwner && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-ink/80">
                  Username
                </label>
                <div className="mt-1.5">
                  <IconInput
                    icon={User}
                    type="text"
                    name="username"
                    value={editingOwner.username}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-ink/80">Email</label>
                <div className="mt-1.5">
                  <IconInput
                    icon={Mail}
                    type="email"
                    name="email"
                    value={editingOwner.email}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-ink/80">
                  New Password
                </label>
                <div className="mt-1.5">
                  <IconInput
                    icon={Lock}
                    type="password"
                    name="password"
                    placeholder="Leave blank to keep current password"
                    value={editingOwner.password}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div className="mt-2 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditingOwner(null)}>
                  Cancel
                </Button>
                <LoadingButton
                  onClick={handleEditSubmit}
                  loading={saving}
                  loadingText="Saving..."
                >
                  Save Changes
                </LoadingButton>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnersManagement;
