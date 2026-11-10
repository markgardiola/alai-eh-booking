import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

// User pages
import LandingPage from "./pages/LandingPage";
import About from "./pages/About";
import Booking from "./pages/Booking";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import UserLayout from "./components/UserLayout";
import Profile from "./pages/Profile";
import Destinations from "./pages/Destinations";
import DestinationDetailPage from "./pages/destinations/DestinationDetailPage";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersManagement from "./pages/admin/UsersManagement";
import OwnersManagement from "./pages/admin/OwnersManagement";
import BeachResortListings from "./pages/admin/BeachResortListings";
import ManageBooking from "./pages/admin/ManageBooking";
import Dashboard from "./pages/admin/Dashboard";
import AdminSignIn from "./pages/AdminSignIn";
import Feedbacks from "./pages/admin/Feedbacks";
import PromoCodes from "./pages/admin/PromoCodes";
import ResortDetails from "./pages/admin/ResortDetails";
import EditResort from "./pages/admin/EditResort";

// Protected Route
import ProtectedRoute from "./components/ProtectedRoute";
import AddResort from "./pages/admin/AddResort";
import ViewDetails from "./pages/ViewDetails";
import Payment from "./pages/Payment";
import BookingDetails from "./pages/admin/BookingDetails";
import MyBooking from "./pages/MyBooking";
import ViewMyBooking from "./pages/ViewMyBooking";
import AdminRefundRequests from "./pages/admin/AdminRefundRequests";

// Owner portal pages
import OwnerSignIn from "./pages/OwnerSignIn";
import OwnerForgotPassword from "./pages/OwnerForgotPassword";
import OwnerPortalLayout from "./pages/owner/OwnerPortalLayout";
import OwnerOverview from "./pages/owner/Overview";
import OwnerMyBookings from "./pages/owner/MyBookings";
import OwnerMyReviews from "./pages/owner/MyReviews";
import OwnerRevenueReport from "./pages/owner/RevenueReport";
import OwnerSettings from "./pages/owner/Settings";

const App = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<UserLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="signIn" element={<SignIn />} />
            <Route path="signUp" element={<SignUp />} />
            <Route path="forgotPassword" element={<ForgotPassword />} />
            <Route path="adminSignIn" element={<AdminSignIn />} />
            <Route path="owner/login" element={<OwnerSignIn />} />
            <Route
              path="owner/forgot-password"
              element={<OwnerForgotPassword />}
            />
            <Route path="profile" element={<Profile />} />
            <Route path="myBooking" element={<MyBooking />} />
            <Route
              path="viewMyBooking/:bookingId"
              element={<ViewMyBooking />}
            />
            <Route path="about" element={<About />} />
            <Route path="viewDetails/:id" element={<ViewDetails />} />
            <Route path="booking/:resortId" element={<Booking />} />
            <Route path="payment" element={<Payment />} />
            <Route path="destinations" element={<Destinations />} />
            <Route
              path="destinations/:slug"
              element={<DestinationDetailPage />}
            />
          </Route>
          <Route
            path="adminDashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="owners" element={<OwnersManagement />} />
            <Route path="resorts" element={<BeachResortListings />} />
            <Route path="resorts/add" element={<AddResort />} />
            <Route path="resorts/:id" element={<ResortDetails />} />
            <Route path="resorts/:id/edit" element={<EditResort />} />
            <Route path="bookings" element={<ManageBooking />} />
            <Route path="refund-requests" element={<AdminRefundRequests />} />
            <Route path="promo-codes" element={<PromoCodes />} />
            <Route
              path="bookingDetails/:bookingId"
              element={<BookingDetails />}
            />
            {<Route path="feedbacks" element={<Feedbacks />} />}
          </Route>
          <Route
            path="owner"
            element={
              <ProtectedRoute role="owner">
                <OwnerPortalLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OwnerOverview />} />
            <Route path="bookings" element={<OwnerMyBookings />} />
            <Route path="reviews" element={<OwnerMyReviews />} />
            <Route path="revenue" element={<OwnerRevenueReport />} />
            <Route path="settings" element={<OwnerSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ToastContainer />
    </div>
  );
};

export default App;
