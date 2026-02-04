import { PublicProfile } from "../profile/PublicProfile";
import { Button } from "@/components/common/Button";
import { Settings as SettingsIcon, ExternalLink } from "lucide-react";
const Profile = () => {

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Public Profile</h1>
          <p className="text-muted-foreground">This is how your profile appears to others in the network.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-2xl gap-2 cursor-not-allowed opacity-70">
            <ExternalLink className="h-4 w-4" />
            Share Profile
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-[2rem] border border-border/50 p-6 sm:p-10 relative overflow-hidden">
        {/* Hint for editing */}
        <div className="mb-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center gap-3 animate-pulse">
          <SettingsIcon className="h-5 w-5 shrink-0" />
          <p>
            <strong>View-Only Mode:</strong> To update this information, please navigate to the
            <span className="font-bold underline ml-1">Settings</span> tab.
          </p>
        </div>

        <PublicProfile />
      </div>
    </div>
  );
};

export default Profile;
