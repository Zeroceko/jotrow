import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, Users, BookOpen, GraduationCap } from 'lucide-react';

interface PublicUser {
  username: string;
  display_name: string | null;
  bio: string | null;
  university: string | null;
  department: string | null;
  course_count: number;
}

const Explore: React.FC = () => {
  const [query, setQuery] = useState('');
  const [featuredUsers, setFeaturedUsers] = useState<PublicUser[]>([]);
  const [searchResults, setSearchResults] = useState<PublicUser[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await api.get('/api/sharing/featured');
        setFeaturedUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch featured users', error);
      }
    };
    fetchFeatured();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.get(`/api/sharing/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResults(null);
  };

  const UserCard = ({ user }: { user: PublicUser }) => {
    const isDemo = user.username === 'demo';
    const name = user.display_name || `@${user.username}`;
    const showHandle = !!user.display_name;

    return (
      <div onClick={() => navigate(`/u/${user.username}`)} className="cursor-pointer">
        <Card
          className={`hover:-translate-y-1 transition-all duration-300 group border-2 ${isDemo
              ? 'border-retro-accent shadow-solid-accent'
              : 'hover:border-retro-accent hover:shadow-solid'
            }`}
        >
          <div className="flex items-start gap-4">
            {/* Avatar placeholder */}
            <div
              className={`w-12 h-12 flex-shrink-0 flex items-center justify-center border-2 transition-colors ${isDemo
                  ? 'bg-retro-accent text-retro-bg border-retro-accent'
                  : 'bg-retro-accent/20 border-retro-accent text-retro-accent group-hover:bg-retro-accent group-hover:text-retro-bg'
                }`}
            >
              <Users size={22} />
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold font-mono truncate">{name}</h3>
                {isDemo && (
                  <span className="bg-retro-accent text-retro-bg text-[10px] px-1.5 py-0.5 font-bold uppercase tracking-tighter">
                    DEMO
                  </span>
                )}
              </div>

              {showHandle && (
                <div className="text-retro-muted font-mono text-xs mt-0.5">@{user.username}</div>
              )}

              {/* University / Department */}
              {(user.university || user.department) && (
                <div className="flex items-center gap-1 text-retro-muted font-mono text-xs mt-1.5">
                  <GraduationCap size={12} className="flex-shrink-0" />
                  <span className="truncate">
                    {[user.university, user.department].filter(Boolean).join(' · ')}
                  </span>
                </div>
              )}

              {/* Bio snippet */}
              {user.bio && (
                <p className="text-retro-muted font-mono text-xs mt-2 line-clamp-2 leading-relaxed">
                  {user.bio}
                </p>
              )}

              {/* Course count */}
              <div className="flex items-center gap-1.5 text-sm text-retro-muted mt-3">
                <BookOpen size={13} />
                <span className="font-mono text-xs">
                  {user.course_count} Course{user.course_count !== 1 && 's'}
                </span>
              </div>
            </div>

            {/* CTA button */}
            <div className="flex-shrink-0 self-start">
              <Button variant={isDemo ? 'primary' : 'secondary'} className="hidden md:block text-xs">
                {isDemo ? 'TRY DEMO_' : 'VIEW_'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter">
          Explore<span className="text-retro-accent">_</span>
        </h1>
        <p className="text-retro-muted font-mono max-w-xl">
          Discover notes and courses from other students. Search by username or browse featured profiles.
        </p>
      </div>

      {/* Search bar */}
      <div className="bg-retro-bg border-4 border-retro-border p-4 shadow-solid">
        <form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="flex-1">
            <Input
              label="SEARCH PROFILES"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Username or display name..."
            />
          </div>
          <Button type="submit" disabled={isLoading} className="mb-1 h-[52px]">
            {isLoading ? 'SEARCHING...' : <><Search size={20} /> SEARCH_</>}
          </Button>
        </form>
        {searchResults !== null && (
          <div className="mt-4 pt-4 border-t-2 border-retro-border border-dashed flex justify-between items-center">
            <p className="font-mono text-sm">Found {searchResults.length} result(s) for "{query}"</p>
            <button onClick={clearSearch} className="text-retro-accent text-sm font-bold uppercase hover:underline">
              Clear Search
            </button>
          </div>
        )}
      </div>

      {/* Results / Featured */}
      <div>
        <h2 className="text-2xl font-bold uppercase tracking-tighter mb-6">
          {searchResults !== null ? 'Search Results' : 'Featured Profiles'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {searchResults !== null ? (
            searchResults.length > 0 ? (
              searchResults.map(user => <UserCard key={user.username} user={user} />)
            ) : (
              <div className="col-span-full py-16 text-center border-4 border-dashed border-retro-border bg-retro-panel/50">
                <Search size={48} className="mx-auto text-retro-muted mb-4 opacity-20" />
                <p className="text-retro-text font-bold text-xl uppercase tracking-tighter mb-2">
                  Searching the void...
                </p>
                <p className="text-retro-muted font-mono mb-6 italic">
                  No profiles found matching "{query}".
                </p>
                <div className="flex flex-col items-center gap-2 text-sm font-mono">
                  <p className="text-retro-accent uppercase font-bold">Try these instead:</p>
                  <ul className="text-retro-muted space-y-1">
                    <li>• Search by full username or display name</li>
                    <li>• Check for typos</li>
                    <li>• Try searching for "demo" (if available)</li>
                  </ul>
                </div>
              </div>
            )
          ) : featuredUsers.length > 0 ? (
            featuredUsers.map(user => <UserCard key={user.username} user={user} />)
          ) : (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-retro-border">
              <p className="text-retro-muted font-mono">No public profiles available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explore;
