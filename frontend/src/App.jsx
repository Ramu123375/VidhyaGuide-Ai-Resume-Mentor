import { useState } from "react";

import Login from "./page/Login";
import Dashboard from "./page/Dashboard";
import Mentor from "./page/Mentor";


function App() {

  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("vidya_user")
  );

  const [page, setPage] = useState("dashboard");


  // =========================================
  // NOT LOGGED IN
  // =========================================

  if (!loggedIn) {
    return <Login />;
  }


  // =========================================
  // MENTOR PAGE
  // =========================================

  if (page === "mentor") {
    return (
      <Mentor
        onBack={() => setPage("dashboard")}
      />
    );
  }


  // =========================================
  // DASHBOARD
  // =========================================

  return (
    <Dashboard
      onOpenMentor={() => setPage("mentor")}
    />
  );
}


export default App;