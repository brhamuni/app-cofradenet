import { Profile } from '../../components/profile/Profile';

export default function PerfilPage() {
  const userId = "123"; 

  return (
    <main className="min-h-screen bg-gray-50">
      <Profile 
        userId={userId} 
        isOwnProfile={true} 
      />
    </main>
  );
}