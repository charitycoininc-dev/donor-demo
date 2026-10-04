import { useState } from "react";
import { db } from "../stores/config/firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      // Save to Firestore
      await addDoc(collection(db, "contactMessages"), {
        ...form,
        createdAt: serverTimestamp(),
      });

      // Send emails via Resend API
      let emailResponse;
      try {
        emailResponse = await fetch("/api/send-contact-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });
      } catch (networkError) {
        console.error("Network error calling email API:", networkError);
        throw new Error(
          "Unable to reach email service. Please check your connection and try again."
        );
      }

      // Check if response is ok before trying to parse JSON
      if (!emailResponse.ok) {
        let errorMessage = "Failed to send emails";
        try {
          const errorResult = await emailResponse.json();
          errorMessage = errorResult.error || errorResult.details || errorMessage;
          console.error("Email API error response:", errorResult);
        } catch (parseError) {
          // If we can't parse JSON, use the status text
          errorMessage = `${emailResponse.status}: ${emailResponse.statusText}`;
          console.error("Could not parse error response:", parseError);
        }
        console.error("Email API error:", errorMessage, "Status:", emailResponse.status);
        throw new Error(errorMessage);
      }

      const emailResult = await emailResponse.json();
      console.log("Email sent successfully:", emailResult);

      setSuccess(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("Contact form error:", error);
      setError(
        error.message ||
          "There was an error submitting your message. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-deep-red-800 mb-6 text-center">
          Contact Us
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Have a question or want to get in touch? Fill out the form below and
          we&apos;ll get back to you soon.
        </p>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-500 hover:bg-gold-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? "Sending..." : "Send Message"}
          </button>
          {success && (
            <div className="mt-4 p-3 bg-green-100 text-green-700 rounded text-center">
              Thank you! Your message has been sent. We will respond typically within two business days.
            </div>
          )}
        </form>
        <div className="mt-8 text-center text-sm text-gray-500">
          Or email us directly at{" "}
          <a
            href="mailto:Info@TheBlackHistoryFoundation.org"
            className="text-gold-600 underline"
          >
            Info@TheBlackHistoryFoundation.org
          </a>
        </div>
      </div>
    </div>
  );
}
