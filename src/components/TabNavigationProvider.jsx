import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const TabNavigationContext = createContext(null);

// Maps any pathname to the bottom tab that owns it (null for unmapped routes)
function getTabFor(pathname) {
  if (pathname === "/" || pathname === "/pitch" || pathname === "/one-pager") return "/";
  if (pathname === "/new-inspection") return "/new-inspection";
  if (pathname === "/reports" || pathname.startsWith("/report")) return "/reports";
  if (pathname === "/issues" || pathname.startsWith("/issues") || pathname === "/locations" || pathname.startsWith("/locations")) return "/issues";
  if (pathname === "/pricing") return "/pricing";
  if (pathname === "/settings") return "/settings";
  return null;
}

// Preserves each bottom tab's history stack: switching tabs restores the
// deepest path visited under that tab; re-selecting the active tab resets
// to the tab's root path.
export function TabNavigationProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const tabStacks = useRef({}); // tab root path -> deepest path visited under that tab

  const activeTab = getTabFor(location.pathname);

  useEffect(() => {
    if (activeTab) tabStacks.current[activeTab] = location.pathname;
  }, [activeTab, location.pathname]);

  const navigateToTab = useCallback(
    (tabRoot) => {
      if (getTabFor(location.pathname) === tabRoot) {
        // Re-selecting the active tab resets to its root
        tabStacks.current[tabRoot] = tabRoot;
        navigate(tabRoot);
      } else {
        navigate(tabStacks.current[tabRoot] || tabRoot);
      }
    },
    [location.pathname, navigate]
  );

  return (
    <TabNavigationContext.Provider value={{ activeTab, navigateToTab }}>
      {children}
    </TabNavigationContext.Provider>
  );
}

export function useTabNavigation() {
  return useContext(TabNavigationContext);
}
