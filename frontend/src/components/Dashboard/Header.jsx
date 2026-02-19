import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronDown } from 'lucide-react';
import NotificationBell from '../Notifications/NotificationBell';

const Header = ({
  userName,
  userEmail,
  showProfileDropdown,
  setShowProfileDropdown,
  handleLogout,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white shadow-md border-b sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Left: Title */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Digital Banking Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {userName}!
          </p>
        </div>

        {/* Right: Bell + Profile */}
        <div className="flex items-center gap-3">
          {/* Notification Bell (new component) */}
          <NotificationBell />

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium">{userName}</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${
                  showProfileDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border z-50">
                <div className="p-3 border-b">
                  <p className="font-semibold text-gray-800">{userName}</p>
                  <p className="text-xs text-gray-500">{userEmail}</p>
                </div>

                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      navigate('/profile');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <User size={18} />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { 
//   Bell, 
//   X, 
//   AlertTriangle, 
//   User, 
//   LogOut, 
//   ChevronDown,
//   IndianRupee,
//   BellRing,
//   TrendingDown,
// } from 'lucide-react';

// const Header = ({
//   userName,
//   userEmail,
//   notifications,
//   showNotifications,
//   setShowNotifications,
//   showProfileDropdown,
//   setShowProfileDropdown,
//   handleDismissAlert,
//   handleLogout,
// }) => {
//   const navigate = useNavigate();

//   const getAlertIcon = (type) => {
//     switch (type) {
//       case 'low_balance':
//         return (
//           <div className="p-2 rounded-lg bg-orange-100">
//             <IndianRupee className="w-4 h-4 text-orange-600" />
//           </div>
//         );
//       case 'budget_exceeded':
//         return (
//           <div className="p-2 rounded-lg bg-red-100">
//             <TrendingDown className="w-4 h-4 text-red-600" />
//           </div>
//         );
//       case 'bill_due':
//         return (
//           <div className="p-2 rounded-lg bg-blue-100">
//             <BellRing className="w-4 h-4 text-blue-600" />
//           </div>
//         );
//       default:
//         return (
//           <div className="p-2 rounded-lg bg-gray-100">
//             <AlertTriangle className="w-4 h-4 text-gray-600" />
//           </div>
//         );
//     }
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return 'Just now';
//     try {
//       return new Date(dateString).toLocaleString('en-IN', {
//         day: '2-digit',
//         month: 'short',
//         hour: '2-digit',
//         minute: '2-digit',
//         hour12: true,
//       });
//     } catch {
//       return 'Just now';
//     }
//   };

//   return (
//     <div className="bg-white shadow-md border-b sticky top-0 z-20">
//       <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//             Digital Banking Dashboard
//           </h1>
//           <p className="text-gray-600 mt-1">Welcome back, {userName}! 👋</p>
//         </div>

//         <div className="flex items-center gap-3">
//           {/* Notification Bell */}
//           <div className="relative">
//             <button
//               onClick={() => setShowNotifications(!showNotifications)}
//               className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
//             >
//               <Bell size={24} />
//               {notifications.length > 0 && (
//                 <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] min-w-[20px] h-[20px] rounded-full flex items-center justify-center font-bold border-2 border-white">
//                   {notifications.length > 9 ? '9+' : notifications.length}
//                 </span>
//               )}
//             </button>

//             {showNotifications && (
//               <>
//                 {/* backdrop to close when clicking outside header area */}
//                 <div
//                   className="fixed inset-0 z-30"
//                   onClick={() => setShowNotifications(false)}
//                 />
//                 <div className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-gray-100 z-40 overflow-hidden">
//                   {/* Header */}
//                   <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-between">
//                     <div>
//                       <h3 className="text-sm font-semibold text-white">Notifications</h3>
//                       {notifications.length > 0 && (
//                         <p className="text-xs text-blue-100">
//                           {notifications.length} item
//                           {notifications.length !== 1 ? 's' : ''} requiring attention
//                         </p>
//                       )}
//                     </div>
//                     <button
//                       onClick={() => setShowNotifications(false)}
//                       className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
//                     >
//                       <X size={16} />
//                     </button>
//                   </div>

//                   {/* List */}
//                   <div className="p-3 max-h-[420px] overflow-y-auto bg-gray-50">
//                     {notifications.length === 0 ? (
//                       <div className="py-10 px-4 text-center text-gray-400">
//                         <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
//                         <p className="text-sm font-medium text-gray-500">
//                           No new notifications
//                         </p>
//                         <p className="text-xs text-gray-400 mt-1">
//                           You&apos;re all caught up! 🎉
//                         </p>
//                       </div>
//                     ) : (
//                       <div className="space-y-3">
//                         {notifications.map((notif) => (
//                           <div
//                             key={notif.id}
//                             className="bg-white rounded-xl border border-gray-100 px-3 py-3 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow"
//                           >
//                             {getAlertIcon(notif.alert_type)}
//                             <div className="flex-1 min-w-0">
//                               <p className="text-xs sm:text-sm text-gray-800 font-medium leading-snug">
//                                 {notif.message}
//                               </p>
//                               <p className="text-[11px] text-gray-500 mt-1">
//                                 {formatDate(notif.created_at)}
//                               </p>
//                             </div>
//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 handleDismissAlert(notif.id);
//                               }}
//                               className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
//                               title="Dismiss alert"
//                             >
//                               <X size={14} />
//                             </button>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </>
//             )}
//           </div>

//           {/* Profile Dropdown */}
//           <div className="relative">
//             <button
//               onClick={() => setShowProfileDropdown(!showProfileDropdown)}
//               className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
//             >
//               <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
//                 {userName.charAt(0).toUpperCase()}
//               </div>
//               <span className="font-medium">{userName}</span>
//               <ChevronDown
//                 size={16}
//                 className={`transition-transform ${
//                   showProfileDropdown ? 'rotate-180' : ''
//                 }`}
//               />
//             </button>

//             {showProfileDropdown && (
//               <>
//                 <div
//                   className="fixed inset-0 z-30"
//                   onClick={() => setShowProfileDropdown(false)}
//                 />
//                 <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border z-40">
//                   <div className="p-3 border-b">
//                     <p className="font-semibold text-gray-800">{userName}</p>
//                     <p className="text-xs text-gray-500 break-all">{userEmail}</p>
//                   </div>

//                   <div className="py-2">
//                     <button
//                       onClick={() => {
//                         setShowProfileDropdown(false);
//                         navigate('/profile');
//                       }}
//                       className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm"
//                     >
//                       <User size={18} />
//                       <span>My Profile</span>
//                     </button>

//                     <button
//                       onClick={() => {
//                         setShowProfileDropdown(false);
//                         handleLogout();
//                       }}
//                       className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors text-sm"
//                     >
//                       <LogOut size={18} />
//                       <span>Logout</span>
//                     </button>
//                   </div>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Header;
