'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface PollData {
  question: string;
  totalVotes: number;
  options: {
    label: string;
    votes: number;
  }[];
}

interface PollStats {
  totalPolls: number;
  totalVotes: number;
  averageVotesPerPoll: number;
  polls: PollData[];
}

const COLORS = ['#2563eb', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

export default function VotesPage() {
  const [stats, setStats] = useState<PollStats>({
    totalPolls: 0,
    totalVotes: 0,
    averageVotesPerPoll: 0,
    polls: [],
  });

  useEffect(() => {
    const fetchPollStats = async () => {
      const postsRef = collection(db, 'posts');
      const snapshot = await getDocs(postsRef);
      
      const pollsData: PollData[] = [];
      let totalVotes = 0;
      let pollCount = 0;

      snapshot.docs.forEach((doc) => {
        const post = doc.data();
        if (post.poll) {
          pollCount++;
          const pollVotes = post.poll.options.reduce((acc: number, opt: any) => acc + opt.votes, 0);
          totalVotes += pollVotes;
          
          pollsData.push({
            question: post.poll.question,
            totalVotes: pollVotes,
            options: post.poll.options,
          });
        }
      });

      setStats({
        totalPolls: pollCount,
        totalVotes: totalVotes,
        averageVotesPerPoll: pollCount > 0 ? Math.round(totalVotes / pollCount) : 0,
        polls: pollsData,
      });
    };

    fetchPollStats();
  }, []);

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <h1 className="text-3xl font-bold mb-8">Poll Statistics</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPolls}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVotes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Votes per Poll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageVotesPerPoll}</div>
          </CardContent>
        </Card>
      </div>

      {/* Polls Chart - Updated version */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats.polls.map((poll, index) => (
          <Card key={index} className="w-full">
            <CardHeader>
              <CardTitle className="text-lg">{poll.question}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bar Chart */}
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={poll.options}>
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="votes" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={poll.options}
                      dataKey="votes"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {poll.options.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
