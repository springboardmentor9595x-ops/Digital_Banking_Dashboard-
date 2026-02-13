// import { Outlet } from "react-router-dom";
// import Sidebar from "../components/Sidebar";
// import Topbar from "../components/Topbar";
// export default function DashboardLayout() {
//   return (
//     <div className="min-h-screen flex bg-[#f7f7fb]">

//       {/* SIDEBAR */}
//       <Sidebar />
     

//       {/* MAIN AREA */}
//       <div className="flex-1 flex flex-col">

//         {/* TOP BAR */}
//         <header className="h-16 bg-white shadow flex items-center justify-between px-6">
//           <h1 className="text-xl font-semibold">Digital Banking Dashboard</h1>
//           <div className="flex items-center gap-4">
//             <div className="bg-[#bde0fe] px-4 py-1 rounded-full font-semibold">
//               Welcome
//             </div>
//             <div className="w-10 h-10 rounded-full bg-[#a2d2ff] flex items-center justify-center font-bold">
//               U
//             </div>
//           </div>
//         </header>

//         {/* PAGE CONTENT */}
//         <main className="flex-1 p-6 overflow-y-auto">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }


import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen flex bg-[#f7f7fb]">
      
      {/* LEFT SIDEBAR */}
      <Sidebar />

      {/* RIGHT MAIN AREA */}
      <div className="flex-1 flex flex-col">
        
        {/* TOP BAR */}
        <Topbar />

        {/* PAGE CONTENT */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
