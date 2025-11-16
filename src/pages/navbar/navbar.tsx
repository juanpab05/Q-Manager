import { useState, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from '../../contexts/auth/AuthContext';
import useMediaQuery from '../../hooks/useMediaQuery'; 
import {
  MenuIcon,
  CloseIcon,
  HomeIcon,
  DashboardIcon,
  AboutIcon,
  RegisterIcon,
  LoginIcon,
  LogoutIcon
} from './NavbarIcons';

const Navbar = () => {
  const auth = useAuth();
  const isAuthenticated = auth?.isAuthenticated;
  
  const handleLogout = async () => {
    try {
      console.log("Navbar: Attempting to logout...");
      
      // Clear any local storage items first
      localStorage.removeItem("usuario");
      
      // Use the auth context logout which now redirects to login page
      await auth.logout();
      
      // No need for additional navigation here as AuthContext will handle it
      console.log("Navbar: Logout initiated via AuthContext");
      
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      
      // If the AuthContext logout fails, try direct navigation
      window.location.href = '/login';
    }
  };

  const isMobile = useMediaQuery("(max-width: 768px)");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonMenuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuOpen &&
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        buttonMenuRef.current && !buttonMenuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    if (isMobile) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, isMobile]);

  // Close mobile menu when route changes
  useEffect(() => {
    if (menuOpen) {
      setMenuOpen(false);
    }
  }, [location?.pathname]);

  const navLinkBase = "px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800 relative";
  const activeClasses = "text-indigo-600 font-semibold after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-1 after:h-[2px] after:w-4/5 after:bg-indigo-600 after:rounded-full";
  const inactiveClasses = "text-neutral-600 hover:text-indigo-600";
  const getClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${navLinkBase} ${activeClasses}` : `${navLinkBase} ${inactiveClasses}`;
  
  // Enhanced mobile styling
  const getMobileClass = ({ isActive }: { isActive: boolean }) => {
    const mobileBase = "block w-full py-3.5 px-5 text-base font-medium rounded-lg transition-all duration-200 ease-in-out transform active:scale-98";
    const mobileActive = "bg-indigo-50 text-indigo-700 font-semibold border-l-4 border-indigo-600";
    const mobileInactive = "text-neutral-700 hover:bg-indigo-50/50 hover:text-indigo-600";
    
    return isActive 
      ? `${mobileBase} ${mobileActive}` 
      : `${mobileBase} ${mobileInactive}`;
  };

  const logoutBtn = "px-4 py-2 rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95";
  const mobileLogoutBtn = "block w-full py-3.5 px-5 mt-2 text-base font-medium rounded-lg text-white bg-red-500 hover:bg-red-600 active:bg-red-700 transition-all duration-200 ease-in-out transform active:scale-98";

  // Function to handle clicks on logout buttons with event capturing
  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any default behavior
    e.stopPropagation(); // Stop event propagation
    handleLogout(); // Call the logout function
    return false; // Ensure no additional handlers are called
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ease-in-out ${scrolled || menuOpen ? "bg-white/95 shadow-xl backdrop-blur-md" : "bg-white/90 shadow-md"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex-shrink-0 text-2xl font-bold text-indigo-600 hover:text-indigo-500 transition-colors duration-200 ease-out transform hover:scale-105 active:scale-100">
            Q-Manager
          </Link>

          {/* Desktop Menu */}
          {!isMobile && (
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-2">
                <NavLink to="/" className={getClass}>Inicio</NavLink>
                
                {/* Enlace al Dashboard para usuarios autenticados */}
                {isAuthenticated && (
                  <NavLink to="/home-user" className={getClass}>Dashboard</NavLink>
                )}
                
                <NavLink to="/about" className={getClass}>Sobre nosotros</NavLink>

                {isAuthenticated ? (
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={handleLogoutClick}
                      className={logoutBtn}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <NavLink to="/register-user" className={getClass}>Regístrate</NavLink>
                    <NavLink to="/login" className={getClass}>Iniciar Sesión</NavLink>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <div className="flex items-center">
              <button
                ref={buttonMenuRef}
                onClick={() => setMenuOpen(!menuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-neutral-600 hover:text-indigo-600 hover:bg-indigo-100/80 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-all duration-300 ease-in-out"
                aria-controls="mobile-menu"
                aria-expanded={menuOpen}
              >
                <span className="sr-only">Abrir menú principal</span>
                <div className="relative w-7 h-7">
                  <span className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${menuOpen ? 'opacity-0 rotate-90 scale-95' : 'opacity-100 rotate-0 scale-100'}`}>
                    <MenuIcon />
                  </span>
                  <span className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${menuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-95'}`}>
                    <CloseIcon />
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobile && (
        <div 
          ref={menuRef} 
          className={`md:hidden transition-all duration-500 ease-in-out overflow-hidden ${
            menuOpen 
              ? "max-h-[500px] opacity-100 translate-y-0" 
              : "max-h-0 opacity-0 -translate-y-4"
          }`} 
          id="mobile-menu"
        >
          <div className="px-3 pt-3 pb-4 space-y-1.5 bg-white shadow-xl rounded-b-xl mx-2 mb-2 border border-t-0 border-gray-200/80">
            <NavLink to="/" className={getMobileClass}>
              <div className="flex items-center">
                <HomeIcon />
                Inicio
              </div>
            </NavLink>
            
            {/* Enlace al Dashboard para usuarios autenticados */}
            {isAuthenticated && (
              <NavLink to="/home-user" className={getMobileClass}>
                <div className="flex items-center">
                  <DashboardIcon />
                  Dashboard
                </div>
              </NavLink>
            )}
            
            <NavLink to="/about" className={getMobileClass}>
              <div className="flex items-center">
                <AboutIcon />
                Sobre nosotros
              </div>
            </NavLink>

            {isAuthenticated ? (
              <button 
                onClick={handleLogoutClick} 
                className={mobileLogoutBtn}
              >
                <div className="flex items-center justify-center">
                  <LogoutIcon />
                  Cerrar sesión
                </div>
              </button>
            ) : (
              <>
                <NavLink to="/register-user" className={getMobileClass}>
                  <div className="flex items-center">
                    <RegisterIcon />
                    Regístrate
                  </div>
                </NavLink>
                <NavLink to="/login" className={getMobileClass}>
                  <div className="flex items-center">
                    <LoginIcon />
                    Iniciar Sesión
                  </div>
                </NavLink>
              </>
            )}
            <div className="pt-1 mt-2 border-t border-gray-200"></div>
            <div className="text-xs text-center text-gray-500 py-1">
              © {new Date().getFullYear()} Q-Manager
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;