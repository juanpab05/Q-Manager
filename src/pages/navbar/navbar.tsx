import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, NavLink } from "react-router-dom";
import { useAuth } from '@/contexts/auth/AuthContext';
import supabase from '@/utils/supabaseClient';

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
};

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-1.5 5.25h16.5" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Navbar = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const isAuthenticated = auth?.isAuthenticated;
  
  const handleLogout = async () => {
    try {
      console.log("Navbar: Attempting to logout...");
      
      // Clear any local storage items first
      localStorage.removeItem("usuario");
      localStorage.removeItem("last_activity_timestamp");
      
      // Use both the auth context logout and a direct Supabase signOut for redundancy
      // This ensures we cover both the context state and the actual auth session
      await auth.logout();
      
      // Also try a direct signOut as a fallback
      await supabase.auth.signOut();
      
      console.log("Navbar: Logout completed, navigating to home");
      
      // Force a page reload to clear any remaining state
      window.location.href = '/';
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      
      // Even if there's an error, try to navigate home
      navigate("/");
      
      // If all else fails, force a page reload
      if (auth?.isAuthenticated) {
        window.location.reload();
      }
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
                  <button 
                    onClick={handleLogoutClick}
                    className={logoutBtn}
                  >
                    Cerrar sesión
                  </button>
                ) : (
                  <>
                    <NavLink to="/register-user" className={getClass}>Regístrate</NavLink>
                    <NavLink to="/login" className={getClass}>Iniciar Sesión</NavLink>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                Inicio
              </div>
            </NavLink>
            
            {/* Enlace al Dashboard para usuarios autenticados */}
            {isAuthenticated && (
              <NavLink to="/home-user" className={getMobileClass}>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                  </svg>
                  Dashboard
                </div>
              </NavLink>
            )}
            
            <NavLink to="/about" className={getMobileClass}>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                Sobre nosotros
              </div>
            </NavLink>

            {isAuthenticated ? (
              <button 
                onClick={handleLogoutClick} 
                className={mobileLogoutBtn}
              >
                <div className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                  </svg>
                  Cerrar sesión
                </div>
              </button>
            ) : (
              <>
                <NavLink to="/register-user" className={getMobileClass}>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                    </svg>
                    Regístrate
                  </div>
                </NavLink>
                <NavLink to="/login" className={getMobileClass}>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                    </svg>
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
