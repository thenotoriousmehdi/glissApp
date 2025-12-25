import { useState, type ReactNode } from "react";
import type { User } from "../../types/auth";
import { ConfirmationModal } from "../ConfirmationModal";
import logogliss from "../../assets/logogliss.png";
import logoglisssmall from "../../assets/logoglisssmall.png";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "../ui/sidebar";
import {
  DashboardSquare01Icon,
  Add01Icon,
  Logout02Icon,
  UserCircle02Icon,
  ContractsIcon,
  PackageMovingIcon,
  ProductLoadingIcon
} from "hugeicons-react";

import { useLocation, useNavigate } from "react-router-dom";

interface AdminLayoutProps {
  children: ReactNode;
  user: User;
  onLogout: () => void;
  pageTitle?: string;
}

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavSection = {
  items: NavItem[];
};

function getNavigationSections(role?: string): NavSection[] {
  const normalizedRole = (role || "").toLowerCase();

  if (normalizedRole === "animator") {
    return [
      {
        items: [{ title: "Ajouter un contact", url: "/addcontacts", icon: Add01Icon }],
      },
    ];
  }

  if (normalizedRole === "admin") {
    return [
      {
        items: [
          {
            title: "Tableau de bord",
            url: "/dashboard-admin",
            icon: DashboardSquare01Icon,
          },
          {
            title: "Contacts",
            url: "/contacts",
            icon: ContractsIcon,
          },
        ],
      },
    ];
  }
  if (normalizedRole === "chef") {
    return [
      {
        items: [
          {
            title: "Tableau de bord",
            url: "/dashboard",
            icon: DashboardSquare01Icon,
          },
           {
            title: "Rendement",
            url: "/rendement",
            icon: ProductLoadingIcon,
          },
          
           {
            title: "Rotation",
            url: "/rotation",
            icon: PackageMovingIcon,
          },
          
          
          
        ],
      },
    ];
  }

  return [
    {
      items: [
        {
          title: "Tableau de bord",
          url: "/dashboard",
          icon: DashboardSquare01Icon,
        },
      ],
    },
  ];
}

export default function DashboardLayout({
  children,
  user,
  onLogout,
  pageTitle,
}: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutClick = () => setShowLogoutModal(true);

  const handleLogoutConfirm = async () => {
    try {
      setIsLoggingOut(true);
      await onLogout();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const handleLogoutCancel = () => setShowLogoutModal(false);
  const handleNavigation = (url: string) => navigate(url);

  const displayName =
    user.full_name ||
    [user.first_name, user.family_name].filter(Boolean).join(" ") ||
    user.username;

  const navigationSections = getNavigationSections(user.role).filter(
    (s) => s.items.length > 0
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon" >
          <SidebarHeader className="border-b border-sidebar-border">
           <div className="flex items-center justify-center ">
              <img
                src={logogliss}
                alt="Logo Lesieur"
                className="w-24 group-data-[collapsible=icon]:hidden"
              />
              <img
                src={logoglisssmall}
                alt="Logo Lesieur"
                className="w-6 hidden group-data-[collapsible=icon]:block"
              />
            </div>
          </SidebarHeader>

          <SidebarContent>
            {navigationSections.map((section) => (
              <SidebarGroup >
               

                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0">
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          onClick={() => handleNavigation(item.url)}
                          isActive={location.pathname === item.url}
                          style={
                            location.pathname === item.url
                              ? {
                                  backgroundColor: "rgba(0, 0, 0, 1)",
                                  color: "#ffffff",
                                  padding: "24px 16px",
                                  boxShadow:
                                    "inset 0 0 20px rgba(255, 255, 255, 0.15)",
                                  transition: "all 0.3s ease",
                                }
                              : { padding: "24px 16px" }
                          }
                          className="w-full data-[active=true]:bg-[#000000] data-[active=true]:text-white hover:data-[active=true]:bg-[#000000]"
                        >
                          <item.icon className="h-4 w-4 group-data-[collapsed=true]:h-12 group-data-[collapsed=true]:w-12 transition-all duration-200" />
                          <span className="group-data-[collapsed=true]:hidden">
                            {item.title}
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border">
            <SidebarMenu>
              <SidebarMenuItem>
                {/* Expanded Footer */}
                <div className="flex items-center justify-between px-2 py-1.5 group-data-[collapsible=icon]:hidden">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <UserCircle02Icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-medium truncate">
                        {displayName}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {user.role}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogoutClick}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                    title="Se déconnecter"
                  >
                    <Logout02Icon className="h-4 w-4" />
                  </button>
                </div>

                {/* Collapsed Footer */}
                <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center py-2">
                  <button
                    onClick={handleLogoutClick}
                    className="flex h-10 w-10 items-center justify-center rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                    title="Se déconnecter"
                  >
                    <Logout02Icon className="h-5 w-5" />
                  </button>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            {pageTitle && (
              <h1 className="text-md font-medium text-black/70">{pageTitle}</h1>
            )}
            <div className="flex-1" />
          </header>

          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>

      {/* Logout Modal */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        title="Confirmer la déconnexion"
        description="Êtes-vous sûr de vouloir vous déconnecter ?"
        confirmText="Se déconnecter"
        cancelText="Annuler"
        isLoading={isLoggingOut}
        variant="danger"
      />
    </SidebarProvider>
  );
}
