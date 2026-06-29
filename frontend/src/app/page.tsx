import HomeClient from '../components/main/HomeClient';
import FeaturedCities from '../components/main/FeaturedCities';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <HomeClient />
      <FeaturedCities />
    </div>
  );
}
