export default function AdminAddUserComponent() {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Add User</h2>
      <button
        onClick={() => window.open("https://www.tbhfdn.org/contact", "_blank")}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Go to Contact Form
      </button>
    </div>
  );
}
