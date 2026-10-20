import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { Plus, Trash2, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/Pagination";
import { API_URL } from "../../../config";

const BeachResortListings = () => {
  const [resorts, setResorts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const resortsPerPage = 6;

  const fetchResorts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/resorts`);
      setResorts(response.data);
    } catch (error) {
      console.error("Failed to fetch resorts:", error);
    }
  };

  useEffect(() => {
    fetchResorts();
  }, []);

  const handleDeleteResort = async (resortId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/resorts/${resortId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResorts((prev) => prev.filter((resort) => resort.id !== resortId));
      toast.success("Resort deleted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete resort.");
    }
  };

  const indexOfLastResort = currentPage * resortsPerPage;
  const indexOfFirstResort = indexOfLastResort - resortsPerPage;
  const currentResorts = resorts.slice(indexOfFirstResort, indexOfLastResort);
  const totalPages = Math.ceil(resorts.length / resortsPerPage);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Private Resort Listings
        </h1>
        <Link to="add">
          <Button className="gap-1.5">
            <Plus className="size-4" />
            Add New Resort
          </Button>
        </Link>
      </div>

      {currentResorts.length === 0 ? (
        <p className="mt-10 text-center text-ink/60">No resorts found.</p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {currentResorts.map((resort) => (
            <Card key={resort.id} className="overflow-hidden gap-0 py-0">
              <img
                src={resort.image}
                alt={resort.name}
                className="h-40 w-full object-cover"
              />
              <div className="p-4">
                <h3 className="font-display text-lg font-semibold text-ink">
                  {resort.name}
                </h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-ink/60">
                  <MapPin className="size-3.5 text-lagoon-dark" />
                  {resort.barangay || resort.location}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-ink/60">
                  {resort.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to={`/adminDashboard/resorts/${resort.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                  <Link to={`/adminDashboard/resorts/${resort.id}/edit`}>
                    <Button variant="secondary" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-seal hover:bg-seal/10 hover:text-seal"
                    onClick={() => {
                      Swal.fire({
                        title: "Are you sure?",
                        text: "This resort will be permanently deleted.",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#b23b2e",
                        cancelButtonColor: "#6b6259",
                        confirmButtonText: "Yes, delete it!",
                      }).then((result) => {
                        if (result.isConfirmed) {
                          handleDeleteResort(resort.id);
                        }
                      });
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default BeachResortListings;
