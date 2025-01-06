'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ThumbsUp, MessageCircle, Share2, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, updateProfile } from 'firebase/auth';
import useSWR from 'swr';
import { usePullToRefresh } from 'use-pull-to-refresh';
import { Label } from '@/components/ui/label';

interface PollOption {
  label: string;
  votes: number;
}

interface Poll {
  question: string;
  options: PollOption[];
  active: boolean;
}

interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
    initials: string;
    aptNumber?: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  poll?: Poll;
}

export default function FeedPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPoll, setIsPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { label: '', votes: 0 },
    { label: '', votes: 0 },
  ]);

  const fetchPosts = async () => {
    const postsCollection = collection(db, 'posts');
    const postsQuery = query(postsCollection, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(postsQuery);

    const postsData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: new Date(doc.data().timestamp?.toDate()).toLocaleString(),
    }));

    return postsData.map((post: any) => ({
      id: post.id,
      author: post.author,
      content: post.content,
      timestamp: post.timestamp,
      likes: post.likes || 0,
      comments: post.comments || 0,
      poll: post.poll || undefined
    }));
  };

  const { data: posts, mutate } = useSWR('posts', fetchPosts, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          id: currentUser.uid,
          name: currentUser.displayName || 'Anonymous',
          avatar: currentUser.photoURL || '/placeholder.svg',
          initials: currentUser.displayName
            ? currentUser.displayName.split(' ').map((n) => n[0]).join('')
            : 'AN',
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const { isRefreshing: isPulling, pullToRefresh } = usePullToRefresh({
    onRefresh: async () => {
      setIsRefreshing(true);
      try {
        await mutate();
      } finally {
        setIsRefreshing(false);
      }
    },
    resistance: 2.5,
  });

  const addPollOption = () => {
    setPollOptions([...pollOptions, { label: '', votes: 0 }]);
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index: number, newLabel: string) => {
    const newOptions = [...pollOptions];
    newOptions[index].label = newLabel;
    setPollOptions(newOptions);
  };

  const handleCreatePost = async () => {
    if (!user) return;

    const userDoc = await getDoc(doc(db, 'users', user.id));
    const aptNumber = userDoc.exists() ? userDoc.data().aptNumber : null;

    const postsCollection = collection(db, 'posts');
    const newPost: any = {
      author: {
        name: user.name,
        avatar: user.avatar,
        initials: user.initials,
        aptNumber: aptNumber || 'Not set',
      },
      content: newPostContent,
      timestamp: serverTimestamp(),
      likes: 0,
      comments: 0,
    };

    if (isPoll && pollQuestion.trim() && pollOptions.filter(opt => opt.label.trim()).length >= 2) {
      newPost.poll = {
        question: pollQuestion.trim(),
        options: pollOptions.filter(opt => opt.label.trim()),
        active: true,
      };
    }

    try {
      await addDoc(postsCollection, newPost);
      await mutate();
      setNewPostContent('');
      setIsPoll(false);
      setPollQuestion('');
      setPollOptions([{ label: '', votes: 0 }, { label: '', votes: 0 }]);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleProfileUpdate = async (newName: string, newAvatarUrl: string) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await updateProfile(currentUser, {
          displayName: newName,
          photoURL: newAvatarUrl,
        });
        setUser({
          ...user,
          name: newName,
          avatar: newAvatarUrl,
          initials: newName
            .split(' ')
            .map((n) => n[0])
            .join(''),
        });
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
  };

  const handleVote = async (postId: string, optionIndex: number) => {
    if (!user) return;

    const postRef = doc(db, 'posts', postId);
    const voteRef = doc(db, `posts/${postId}/votes/${user.id}`);

    try {
      // Check if user has already voted
      const voteDoc = await getDoc(voteRef);
      if (voteDoc.exists()) {
        return; // User has already voted
      }

      // Get current post data
      const postDoc = await getDoc(postRef);
      if (!postDoc.exists()) return;

      const postData = postDoc.data();
      if (!postData.poll?.options) return;

      // Update vote count
      const updatedOptions = [...postData.poll.options];
      updatedOptions[optionIndex].votes += 1;

      // Update post and record vote
      await Promise.all([
        updateDoc(postRef, {
          'poll.options': updatedOptions
        }),
        setDoc(voteRef, {
          optionIndex,
          timestamp: serverTimestamp()
        })
      ]);

      await mutate();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  return (
    <div 
      className="container mx-auto max-w-2xl px-4 py-8"
      {...pullToRefresh}
    >
      {(isRefreshing || isPulling) && (
        <div className="fixed top-16 left-0 right-0 flex justify-center z-50">
          <div className="bg-indigo-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Refreshing...</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {posts?.map((post) => (
          <Card key={post.id}>
            <CardHeader className="flex flex-row items-center space-x-4 p-4">
              <Avatar>
                <AvatarImage src={post.author.avatar} />
                <AvatarFallback>{post.author.initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold">{post.author.name}</span>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>{post.timestamp}</span>
                  <span>•</span>
                  <span>APT {post.author.aptNumber}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-gray-700">{post.content}</p>
              {post.poll && (
                <div className="mt-4 space-y-4">
                  <p className="font-semibold">{post.poll.question}</p>
                  <div className="space-y-2">
                    {post.poll.options.map((option: PollOption, index: number) => {
                      const totalVotes = post.poll.options.reduce((acc: number, opt: PollOption) => acc + opt.votes, 0);
                      const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                      
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`poll-${post.id}`}
                              onChange={() => handleVote(post.id, index)}
                              className="h-4 w-4"
                            />
                            <span>{option.label}</span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="text-sm text-gray-500">
                            {option.votes} votes ({percentage.toFixed(1)}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t p-4">
              <div className="flex space-x-6">
                <Button variant="ghost" size="sm" className="space-x-2">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{post.likes}</span>
                </Button>
                <Button variant="ghost" size="sm" className="space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.comments}</span>
                </Button>
                <Button variant="ghost" size="sm" className="space-x-2">
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg md:bottom-6"
            size="icon"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Create New Post</DialogTitle>
          </DialogHeader>
          <div className="mt-6">
            <div className="flex items-start space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{user?.initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <Label htmlFor="post-content" className="sr-only">
                  Post content
                </Label>
                <Textarea
                  id="post-content"
                  placeholder="What would you like to share?"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-[120px] resize-none border-0 bg-transparent p-0 text-lg focus:ring-0"
                />
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPoll"
                    checked={isPoll}
                    onChange={(e) => setIsPoll(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isPoll">Create a poll</Label>
                </div>

                {isPoll && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="poll-question">Poll Question</Label>
                      <input
                        type="text"
                        id="poll-question"
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        placeholder="Ask a question..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Options</Label>
                      {pollOptions.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={option.label}
                            onChange={(e) => handlePollOptionChange(index, e.target.value)}
                            className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                            placeholder={`Option ${index + 1}`}
                          />
                          {pollOptions.length > 2 && (
                            <button
                              onClick={() => removePollOption(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      {pollOptions.length < 6 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addPollOption}
                          className="mt-2"
                        >
                          Add Option
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <div className="flex items-center space-x-2">
              {/* Add attachment options if needed */}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePost}
                disabled={
                  (!newPostContent.trim() && !isPoll) ||
                  (isPoll && (!pollQuestion.trim() || pollOptions.filter(opt => opt.label.trim()).length < 2))
                }
                className="min-w-[80px]"
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Post'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
