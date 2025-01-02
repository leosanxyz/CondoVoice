'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ThumbsUp, MessageCircle, Share2, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, updateProfile } from 'firebase/auth';
import useSWR from 'swr';
import { usePullToRefresh } from 'use-pull-to-refresh';
import { Label } from '@/components/ui/label';

interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
    initials: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
}

export default function FeedPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleCreatePost = async () => {
    if (!user) return;

    const postsCollection = collection(db, 'posts');
    const newPost = {
      author: {
        name: user.name,
        avatar: user.avatar,
        initials: user.initials,
      },
      content: newPostContent,
      timestamp: serverTimestamp(),
      likes: 0,
      comments: 0,
    };

    try {
      await addDoc(postsCollection, newPost);
      await mutate();
      setNewPostContent('');
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
                <span className="text-sm text-gray-500">{post.timestamp}</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-gray-700">{post.content}</p>
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
              <div className="flex-1 space-y-2">
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
                disabled={!newPostContent.trim() || isRefreshing}
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
