'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ThumbsUp, MessageCircle, Share2 } from 'lucide-react';
import { db } from '@/lib/firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, updateProfile } from 'firebase/auth';

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          id: currentUser.uid,
          name: currentUser.displayName || 'Anonymous',
          avatar: currentUser.photoURL || '/placeholder.svg',
          initials: currentUser.displayName
            ? currentUser.displayName
                .split(' ')
                .map((n) => n[0])
                .join('')
            : 'AN',
        });
      } else {
        setUser(null);
      }
    });

    const fetchPosts = async () => {
      const postsCollection = collection(db, 'posts');
      const postsQuery = query(postsCollection, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(postsQuery);

      const postsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: new Date(doc.data().timestamp?.toDate()).toLocaleString(),
      }));

      setPosts(
        postsData.map((post: any) => ({
          id: post.id,
          author: post.author,
          content: post.content,
          timestamp: post.timestamp,
          likes: post.likes || 0,
          comments: post.comments || 0,
        }))
      );
    };

    fetchPosts();

    return () => unsubscribeAuth();
  }, []);

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
      const docRef = await addDoc(postsCollection, newPost);
      setPosts([
        {
          id: docRef.id,
          author: newPost.author,
          content: newPostContent,
          timestamp: new Date().toLocaleString(),
          likes: 0,
          comments: 0,
        },
        ...posts,
      ]);
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
    <div className="container mx-auto max-w-2xl px-4 py-8">
      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.map((post) => (
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

      {/* Floating Action Button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
            size="icon"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Textarea
              placeholder="What's on your mind?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end">
              <Button onClick={handleCreatePost} disabled={!newPostContent.trim()}>
                Post
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
