import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";

const App = () => {
  const location = useLocation();
  const hideNavbarPaths = ['/login', '/register'];
  const shouldShowNavbar = !hideNavbarPaths.includes(location.pathname);

  return (
    <div className="w-full px-6 pb-6">
      {shouldShowNavbar && <Navbar />}
      <Outlet />
    </div>
  );
};
export default App