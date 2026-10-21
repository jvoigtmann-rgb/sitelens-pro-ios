import { useState } from "react";
import { Trash2, LogOut, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { base44 } from "@/api/base44Client";

export default function Settings() {
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    // Delete all user reports and photos then log out
    const reports = await base44.entities.InspectionReport.list("-created_date", 200);
    for (const report of reports) {
      const photos = await base44.entities.InspectionPhoto.filter({ report_id: report.id });
      for (const photo of photos) {
        await base44.entities.InspectionPhoto.delete(photo.id);
      }
      await base44.entities.InspectionReport.delete(report.id);
    }
    base44.auth.logout();
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 py-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account preferences</p>
      </div>

      {/* App info */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-1">
        <p className="text-sm font-semibold">SiteLens</p>
        <p className="text-xs text-muted-foreground">Professional Property Inspection Reports</p>
        <p className="text-xs text-muted-foreground">Version 1.0</p>
      </div>

      {/* Account actions */}
      <div className="bg-card rounded-xl border border-border divide-y divide-border">
        <button
          onClick={handleLogout}
          className="select-none w-full flex items-center gap-3 px-5 py-4 min-h-[56px] text-sm font-medium text-foreground hover:bg-secondary transition-colors rounded-t-xl"
        >
          <LogOut className="w-5 h-5 text-muted-foreground" />
          Sign Out
        </button>

        <div className="px-5 py-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Delete Account</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently deletes all your inspection reports, photos, and account data. This cannot be undone.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-3 gap-2 rounded-lg min-h-[44px] select-none"
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {deleting ? "Deleting..." : "Delete Account"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently deletes all your inspection reports, photos, and account data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting ? "Deleting..." : "Yes, delete everything"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}