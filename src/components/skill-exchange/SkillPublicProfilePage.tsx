import { useParams } from "react-router-dom";
import { PublicProfile } from "@/components/profile/PublicProfile";

export function SkillPublicProfilePage() {
  const { userId = "" } = useParams();
  return (
    <div className="mx-auto max-w-5xl py-6">
      <PublicProfile userId={userId} />
    </div>
  );
}

export default SkillPublicProfilePage;
