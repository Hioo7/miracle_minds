"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  // For a potential therapist details modal
  const [selectedTherapist, setSelectedTherapist] = useState(null);

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get("https://miracle-minds.vercel.app/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const items = response.data;

      // sum first therapy cost in each item
      const total = items.reduce(
        (sum, item) => sum + (item.therapies[0]?.cost || 0),
        0
      );
      setCartItems(items);
      setTotalAmount(total);
    } catch (error) {
      toast.error("Failed to fetch cart items!", {
        position: "top-center",
        autoClose: 3000,
      });
      console.error("Error fetching cart items:", error);
    }
  };

  const handleRemoveFromCart = async (item) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.delete(`https://miracle-minds.vercel.app/api/cart/${item._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const therapyName = item.therapies[0]?.name || "N/A";
      toast.success(`Removed "${therapyName}" from cart!`, {
        position: "top-center",
        autoClose: 3000,
      });

      await fetchCartItems();
    } catch (error) {
      toast.error("Failed to remove item from cart.", {
        position: "top-center",
        autoClose: 3000,
      });
      console.error("Error removing item from cart:", error);
    }
  };

  const handleCheckout = async () => {
    try {
      if (!cartItems.length) {
        toast.error("Cart is empty!", {
          position: "top-center",
          autoClose: 3000,
        });
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) return;

      // 1) Create order
      const createOrderRes = await axios.post(
        "https://miracle-minds.vercel.app/api/payments/create-order",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!createOrderRes.data.success) {
        toast.error("Could not create Razorpay order.", {
          position: "top-center",
          autoClose: 3000,
        });
        return;
      }

      const { orderId, amount, currency } = createOrderRes.data;

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: amount.toString(),
        currency,
        name: "Miracle Minds",
        description: "Therapy Payment",
        order_id: orderId,
        handler: async function (response) {
          const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
          } = response;
          try {
            // 3) Verify on the server
            await axios.post(
              "https://miracle-minds.vercel.app/api/payments/verify",
              {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Payment verified! Bookings created successfully.", {
              position: "top-center",
              autoClose: 3000,
            });

            await fetchCartItems();
          } catch (error) {
            toast.error("Payment verification/booking failed.", {
              position: "top-center",
              autoClose: 3000,
            });
            console.error("Error verifying payment:", error);
          }
        },
        theme: {
          color: "#3399cc",
        },
        prefill: {
          email: "test@example.com",
          contact: "9999999999",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error("Error during checkout. Please try again.", {
        position: "top-center",
        autoClose: 3000,
      });
      console.error("Error in handleCheckout:", error);
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-gray-200 rounded-md max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Your Cart</h1>

      {cartItems.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cartItems.map((item) => {
              const therapyName = item.therapies[0]?.name || "N/A";
              const therapyCost = item.therapies[0]?.cost || 0;
              const profileName = item.profile?.name || "No Profile Name";
              const therapistName = item.therapist?.name || "Not Assigned";
              const itemMode = item.mode?.toUpperCase() || "ONLINE";

              return (
                <div
                  key={item._id}
                  className="bg-gray-800 rounded-md p-6 shadow-lg flex flex-col justify-between transition transform hover:scale-105"
                >
                  <div>
                    <h2 className="text-xl font-semibold mb-2">{therapyName}</h2>
                    <p className="text-sm text-gray-400 mb-1">
                      <span className="font-semibold">Profile:</span> {profileName}
                    </p>
                    <p className="text-sm text-gray-400 mb-1">
                      <span className="font-semibold">Therapist:</span> {therapistName}
                    </p>
                    <p className="text-sm text-gray-400 mb-1">
                      <span className="font-semibold">Date:</span> {item.date}
                    </p>
                    <p className="text-sm text-gray-400 mb-1">
                      <span className="font-semibold">Timeslot:</span> {item.timeslot.from} - {item.timeslot.to}
                    </p>
                    <p className="text-sm text-gray-400 mb-1">
                      <span className="font-semibold">Mode:</span> {itemMode}
                    </p>
                    <p className="text-sm text-gray-400">
                      <span className="font-semibold">Cost (₹):</span> {therapyCost}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRemoveFromCart(item)}
                    className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex justify-end">
            <h2 className="text-2xl font-semibold">Total Amount: ₹{totalAmount}</h2>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={handleCheckout}
              className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 transition text-lg font-semibold"
            >
              Proceed to Payment
            </button>
          </div>
        </>
      ) : (
        <p className="text-center text-gray-400">Your cart is empty.</p>
      )}
    </div>
  );
}
