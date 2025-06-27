
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface UserProfileProps {
  onAuthClick: () => void;
}

const UserProfile = ({ onAuthClick }: UserProfileProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Success",
        description: "Signed out successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-white">
          Welcome, {user.user_metadata?.username || user.email}!
        </span>
        <Button onClick={handleSignOut} variant="outline" size="sm">
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={onAuthClick} variant="outline" size="sm">
      Sign In
    </Button>
  );
};

export default UserProfile;
