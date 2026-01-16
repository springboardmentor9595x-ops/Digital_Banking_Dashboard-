import { jwtDecode } from "jwt-decode";

export default function Profile() {
  const token = localStorage.getItem("token");
  const user = token ? jwtDecode(token) : null;

  if (!user) {
    return <div className="p-6">Unauthorized</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-semibold mb-6">User Profile</h2>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{user.sub}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">User ID</p>
            <p className="font-medium">{user.user_id}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Account Type</p>
            <p className="font-medium">Retail Banking</p>
          </div>
        </div>
      </div>
    </div>
  );
}
