
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LeaderboardEntry {
  id: string;
  username: string;
  finish_time: number;
  created_at: string;
}

interface LeaderboardProps {
  currentRaceResults: Array<{
    username: string;
    finishTime: number;
    characterName: string;
    characterEmoji: string;
  }>;
}

const Leaderboard = ({ currentRaceResults }: LeaderboardProps) => {
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<LeaderboardEntry[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('race_results')
        .select(`
          id,
          username,
          finish_time,
          created_at
        `)
        .order('finish_time', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
      }

      setAllTimeLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const formatTime = (timeInMs: number) => {
    const seconds = Math.floor(timeInMs / 1000);
    const milliseconds = timeInMs % 1000;
    return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
      {/* Current Race Results */}
      <Card className="bg-white/20 backdrop-blur-sm border-white/30">
        <CardHeader>
          <CardTitle className="text-white text-xl">This Race</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/20">
                <TableHead className="text-white/90">#</TableHead>
                <TableHead className="text-white/90">Player</TableHead>
                <TableHead className="text-white/90">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRaceResults.map((result, index) => (
                <TableRow key={index} className="border-white/10">
                  <TableCell className="text-white font-bold">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </TableCell>
                  <TableCell className="text-white">
                    <div className="flex items-center gap-2">
                      <span>{result.characterEmoji}</span>
                      <span>{result.username}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/90">
                    {formatTime(result.finishTime)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* All-Time Leaderboard */}
      <Card className="bg-white/20 backdrop-blur-sm border-white/30">
        <CardHeader>
          <CardTitle className="text-white text-xl">🏆 All-Time Best</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/20">
                <TableHead className="text-white/90">#</TableHead>
                <TableHead className="text-white/90">Player</TableHead>
                <TableHead className="text-white/90">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTimeLeaderboard.length > 0 ? (
                allTimeLeaderboard.map((entry, index) => (
                  <TableRow key={entry.id} className="border-white/10">
                    <TableCell className="text-white font-bold">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </TableCell>
                    <TableCell className="text-white">
                      {entry.username}
                    </TableCell>
                    <TableCell className="text-white/90">
                      {formatTime(entry.finish_time)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-white/10">
                  <TableCell colSpan={3} className="text-white/70 text-center py-4">
                    No records yet. Be the first to set a record!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;
