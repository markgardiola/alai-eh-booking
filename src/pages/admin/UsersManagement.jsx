import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { Trash2, User, Mail, Lock, Phone, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/LoadingButton";
import useSingleFlight from "@/hooks/useSingleFlight";
import IconInput from "@/components/IconInput";
import Pagination from "@/components/Pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { API_URL } from "../../../config";

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [runSave, saving] = useSingleFlight();
  const [runDelete, deleting] = useSingleFlight();
  const [deletingId, setDeletingId] = useState(null);
  const usersPerPage = 10;

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch users");
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    setEditingUser({ ...editingUser, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = () =>
    runSave(async () => {
      try {
        await axios.put(`${API_URL}/api/users/${editingUser.id}`, editingUser, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("User updated successfully!");
        setEditingUser(null);
        fetchUsers();
      } catch (err) {
        console.error(err);
        toast.error("Failed to update user.");
      }
    });

  const handleDeleteUser = (userId) =>
    runDelete(async () => {
      setDeletingId(userId);
      try {
        await axios.delete(`${API_URL}/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("User deleted successfully!");
        fetchUsers();
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete user.");
      } finally {
        setDeletingId(null);
      }
    });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">
        User Management
      </h1>

      {loading ? (
        <p className="mt-6 text-ink/60">Loading users...</p>
      ) : error ? (
        <p className="mt-6 text-seal">{error}</p>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/50">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Username</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Mobile No.</th>
                  <th className="px-4 py-3 font-medium">Address</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-4 py-6 text-center text-ink/50"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user, index) => (
                    <tr
                      key={user.id}
                      className="border-b border-ink/5 last:border-0"
                    >
                      <td className="px-4 py-3">
                        {indexOfFirstUser + index + 1}
                      </td>
                      <td className="px-4 py-3">{user.username}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">{user.phone}</td>
                      <td className="px-4 py-3">{user.address}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-seal hover:bg-seal/10 hover:text-seal"
                            disabled={deleting}
                            onClick={() => {
                              Swal.fire({
                                title: "Are you sure?",
                                text: "This user will be permanently deleted.",
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonColor: "#b23b2e",
                                cancelButtonColor: "#6b6259",
                                confirmButtonText: "Yes, delete it!",
                              }).then((result) => {
                                if (result.isConfirmed) {
                                  handleDeleteUser(user.id);
                                }
                              });
                            }}
                          >
                            {deletingId === user.id ? (
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
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>

          {editingUser && (
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
                    value={editingUser.username}
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
                    value={editingUser.email}
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
                    value={editingUser.password || ""}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-ink/80">
                  Mobile No.
                </label>
                <div className="mt-1.5">
                  <IconInput
                    icon={Phone}
                    type="text"
                    name="phone"
                    value={editingUser.phone || ""}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-ink/80">
                  Address
                </label>
                <div className="mt-1.5">
                  <IconInput
                    icon={MapPin}
                    type="text"
                    name="address"
                    value={editingUser.address || ""}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div className="mt-2 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
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

export default UsersManagement;
