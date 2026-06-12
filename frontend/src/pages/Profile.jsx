import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import UserProfileCard from '../components/profile/UserProfileCard';
import { defaultUserProfile } from '../data/userProfile';

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  const profile = {
    fullName: user?.name || defaultUserProfile.fullName,
    email: user?.email || defaultUserProfile.email,
    role: user?.role || defaultUserProfile.role,
    region: user?.region || defaultUserProfile.region,
    bio: user?.bio || defaultUserProfile.bio,
    joinedDate: user?.joinedDate || null,
    transactionCount: user?.transactionCount ?? defaultUserProfile.transactionCount,
  };
  const handleEdit = () => {
    // lightweight edit handler — replace with modal or route as needed
    const newName = window.prompt('Edit full name', profile.fullName);
    if (newName) {
      window.alert(`Name changed to "${newName}" (local only)`);
    }
  };

  return (
    <div className="min-h-full rounded-[32px] bg-slate-100 p-0 sm:p-4 lg:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-2xl items-start justify-center overflow-hidden bg-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.35)] sm:rounded-[32px]">
        <UserProfileCard user={profile} loading={loading} />
      </div>
    </div>
  );
}
