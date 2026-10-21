import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Plus, FileText, Map, Settings, ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { TabNavigationProvider, useTabNavigation } from "./TabNavigationProvider";

const navItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/new-inspection", label: "New", icon: Plus },
  { path: "/reports", label: "Reports", icon: FileText },
  { path: "/issues", label: "Map", icon: Map },
  { path: "/pricing", label: "Plans", icon: CreditCard },
  { path: "/settings", label: "Settings", icon: Settings },
];

// Child screens render a Back button + title in the header instead of branding + desktop nav
const childScreens = [
  { match: /^\/report\//, title: "Report View" },
  { match: /^\/new-inspection$/, title: "New Inspection" },
  { match: /^\/locations$/, title: "Locations" },
];

function LayoutInner() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeTab, navigateToTab } = useTabNavigation();
  const child = childScreens.find((c) => c.match.test(location.pathname));

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header — branding on main screens, back + title on child screens */}
      <header className="sticky top-0 z-50 border-b border-[#0a1f3d] bg-[#040d1a] backdrop-blur-xl print-hide safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {child ? (
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl shrink-0 min-h-[44px] min-w-[44px]"
                  onClick={goBack}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <span className="text-lg font-bold tracking-tight text-white truncate">
                  {child.title}
                </span>
              </div>
            ) : (
              <>
                <Link to="/" className="flex items-center gap-3 select-none">
                  <img src="https://media.base44.com/images/public/69dd169eb39b0ed1546dd22e/c091f8c08_IMG_0290.png" alt="SiteLens" className="w-9 h-9 rounded-lg object-cover" />
                  <span className="text-xl font-bold tracking-tight flex items-center">
                    <span className="text-white">Site</span><span style={{ color: '#2dd4bf' }}>Lens</span>
                    <span className="ml-2 text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: '#2dd4bf', color: '#0a1628' }}>Pro</span>
                  </span>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden sm:flex items-center gap-1">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`select-none flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "text-[#040d1a] shadow-sm"
                            : "text-slate-400 hover:text-white hover:bg-white/10"
                        }`}
                        style={isActive ? { background: '#2dd4bf' } : {}}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-[#040d1a]/95 backdrop-blur-xl border-t border-[#0a1f3d] safe-bottom print-hide">
        <div className="flex items-stretch">
          {navItems.map((item) => {
            const isActive = activeTab === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigateToTab(item.path)}
                className={`select-none flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  isActive ? "text-[#2dd4bf]" : "text-slate-500"
                }`}
              >
                <item.icon className={`w-6 h-6`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function Layout() {
  return (
    <TabNavigationProvider>
      <LayoutInner />
    </TabNavigationProvider>
  );
}
