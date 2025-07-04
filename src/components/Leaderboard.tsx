
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

interface PersonalBest {
  id: string;
  username: string;
  best_time: number;
  character_name: string;
  character_emoji: string;
  achieved_at: string;
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
  const [personalBests, setPersonalBests] = useState<PersonalBest[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
    fetchPersonalBests();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('race_results')
        .select('*')
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

  const fetchPersonalBests = async () => {
    try {
      const { data, error } = await supabase
        .from('personal_bests')
        .select('*')
        .order('best_time', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error fetching personal bests:', error);
        return;
      }

      setPersonalBests(data || []);
    } catch (error) {
      console.error('Error fetching personal bests:', error);
    }
  };

  const formatTime = (timeInMs: number) => { 
    return (timeInMs).toFixed(3) + 's';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
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

      {/* Personal Bests */}
      <Card className="bg-white/20 backdrop-blur-sm border-white/30">
        <CardHeader>
          <CardTitle className="text-white text-xl">🏆 Personal Bests</CardTitle>
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
              {personalBests.length > 0 ? (
                personalBests.map((entry, index) => (
                  <TableRow key={entry.id} className="border-white/10">
                    <TableCell className="text-white font-bold">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </TableCell>
                    <TableCell className="text-white">
                      <div className="flex items-center gap-2">
                        <span>{entry.character_emoji}</span>
                        <span>{entry.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-white/90">
                      {formatTime(entry.best_time)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-white/10">
                  <TableCell colSpan={3} className="text-white/70 text-center py-4">
                    No personal bests yet!
                  </TableCell>
                </TableRow>
              )}
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
