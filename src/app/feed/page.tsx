"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  ThumbsUp,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  FieldValue, // Para tipar serverTimestamp()
  arrayUnion,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import useSWR from "swr";
import { usePullToRefresh } from "use-pull-to-refresh";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------
   Tipos e interfaces
------------------------------------------------------------ */

interface PollOption {
  label: string;
  votes: number;
}

interface Poll {
  question: string;
  options: PollOption[];
  active: boolean;
}

interface User {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  aptNumber?: string;
  isEmojiAvatar: boolean;
}

/**
 * En la base de datos guardamos un objeto que,
 * tras mapear `timestamp` a un string, quedará así.
 */
interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
    initials: string;
    aptNumber: string;
    isEmojiAvatar: boolean;
  };
  content: string;
  timestamp: string;
}

interface FirebasePost {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    initials: string;
    aptNumber: string;
    isEmojiAvatar: boolean;
  };
  content: string;
  timestamp: string;
  likes: string[]; // Array of user IDs who liked the post
  comments: Comment[];
  poll?: Poll;
}

/**
 * Al crear un nuevo Post para Firestore (antes de hacer addDoc),
 * necesitamos un tipo con `FieldValue` en `timestamp`.
 */
interface NewPostData {
  author: {
    id: string;
    name: string;
    avatar: string;
    initials: string;
    aptNumber: string;
    isEmojiAvatar: boolean;
  };
  content: string;
  timestamp: FieldValue;
  likes: string[]; // Array of user IDs
  comments: Comment[]; // Array of comments
  poll?: {
    question: string;
    options: PollOption[];
    active: boolean;
  };
}

interface RawComment {
  id?: string;
  author?: {
    name?: string;
    avatar?: string;
    initials?: string;
    aptNumber?: string;
    isEmojiAvatar?: boolean;
  };
  content?: string;
  timestamp?: string | { toDate(): Date };
}

export default function FeedPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPoll, setIsPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { label: "", votes: 0 },
    { label: "", votes: 0 },
  ]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  /* ------------------------------------------------------------
     Carga de POSTS
  ------------------------------------------------------------ */
  const fetchPosts = async (): Promise<FirebasePost[]> => {
    try {
      const postsCollection = collection(db, "posts");
      const postsQuery = query(postsCollection, orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(postsQuery);

      const postsData: FirebasePost[] = await Promise.all(querySnapshot.docs.map(async (document) => {
        const data = document.data();
        const rawComments = data.comments || [];

        // Get the author's current data from Firestore
        let authorData = null;
        if (data.author && typeof data.author.id === 'string') {
          try {
            const authorDoc = await getDoc(doc(db, 'users', data.author.id));
            authorData = authorDoc.exists() ? authorDoc.data() : null;
          } catch (error) {
            console.error('Error fetching author data:', error);
          }
        }

        const comments = rawComments.map((comment: RawComment) => ({
          id: comment.id || crypto.randomUUID(),
          author: {
            name: comment.author?.name || 'Anonymous',
            avatar: comment.author?.avatar || '',
            initials: comment.author?.initials || 'AN',
            aptNumber: comment.author?.aptNumber || 'Not set',
            isEmojiAvatar: comment.author?.isEmojiAvatar || false,
          },
          content: comment.content || '',
          timestamp: typeof comment.timestamp === 'string'
            ? comment.timestamp
            : format(new Date(), 'MMM d, yyyy h:mm a')
        }));

        return {
          id: document.id,
          author: {
            id: data.author?.id || document.id, // Fallback to document ID if no author ID
            name: data.author?.name || 'Anonymous',
            avatar: authorData?.avatar || data.author?.avatar || '',
            initials: data.author?.initials || 'AN',
            aptNumber: data.author?.aptNumber || 'Not set',
            isEmojiAvatar: authorData?.isEmojiAvatar || data.author?.isEmojiAvatar || false,
          },
          content: data.content || '',
          timestamp: data.timestamp?.toDate ? format(data.timestamp.toDate(), 'MMM d, yyyy h:mm a') : format(new Date(), 'MMM d, yyyy h:mm a'),
          likes: Array.isArray(data.likes) ? data.likes : [],
          comments,
          poll: data.poll,
        };
      }));

      return postsData;
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  };

  const { data: posts, mutate } = useSWR("posts", fetchPosts, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  });

  /* ------------------------------------------------------------
     Autenticación y obtención de usuario actual
  ------------------------------------------------------------ */
  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          id: currentUser.uid,
          name: currentUser.displayName || "Anonymous",
          avatar: currentUser.photoURL || "/placeholder.svg",
          initials: currentUser.displayName
            ? currentUser.displayName
                .split(" ")
                .map((n) => n[0])
                .join("")
            : "AN",
          isEmojiAvatar: false,
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  /* ------------------------------------------------------------
     Pull to Refresh
  ------------------------------------------------------------ */
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

  /* ------------------------------------------------------------
     Lógica de creación de Post (normal o con encuesta)
  ------------------------------------------------------------ */
  const addPollOption = () => {
    setPollOptions((current) => [...current, { label: "", votes: 0 }]);
  };

  const removePollOption = (index: number) => {
    // Mantenemos un mínimo de 2 opciones
    if (pollOptions.length > 2) {
      setPollOptions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index: number, newLabel: string) => {
    setPollOptions((prev) => {
      const newOptions = [...prev];
      newOptions[index].label = newLabel;
      return newOptions;
    });
  };

  const handleCreatePost = async () => {
    if (!user) return;

    // Get the current user data from Firestore
    const userDoc = await getDoc(doc(db, "users", user.id));
    const userData = userDoc.exists() ? userDoc.data() : null;

    // Definimos el tipo exacto del nuevo Post
    const newPost: NewPostData = {
      author: {
        id: user.id,
        name: user.name,
        avatar: userData?.avatar || user.avatar,
        initials: user.initials,
        aptNumber: userData?.aptNumber || "Not set",
        isEmojiAvatar: userData?.isEmojiAvatar || false,
      },
      content: newPostContent,
      timestamp: serverTimestamp(),
      likes: [], // Initialize empty array for likes
      comments: [], // Initialize empty array for comments
    };

    // Si creamos una Poll válida, se la anexamos
    const validPollOptions = pollOptions.filter((opt) =>
      opt.label.trim()
    );
    if (isPoll && pollQuestion.trim() && validPollOptions.length >= 2) {
      newPost.poll = {
        question: pollQuestion.trim(),
        options: validPollOptions,
        active: true,
      };
    }

    try {
      await addDoc(collection(db, "posts"), newPost);

      // Forzamos la recarga de SWR
      await mutate();

      // Reseteamos estado
      setNewPostContent("");
      setIsPoll(false);
      setPollQuestion("");
      setPollOptions([
        { label: "", votes: 0 },
        { label: "", votes: 0 },
      ]);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  /* ------------------------------------------------------------
     Lógica de Votación en encuestas
  ------------------------------------------------------------ */
  const handleVote = async (postId: string, optionIndex: number) => {
    if (!user) return;

    const postRef = doc(db, "posts", postId);
    const voteRef = doc(db, `posts/${postId}/votes/${user.id}`);

    try {
      // Verificamos si el usuario ya votó
      const voteDoc = await getDoc(voteRef);
      if (voteDoc.exists()) {
        return; // Ya ha votado
      }

      // Obtenemos el post actual
      const postDoc = await getDoc(postRef);
      if (!postDoc.exists()) return;

      // Tipamos los datos como un objeto que *puede* tener poll
      const postData = postDoc.data() as {
        poll?: { options: PollOption[] };
      };
      if (!postData.poll?.options) return;

      // Actualizamos el conteo de votos
      const updatedOptions = [...postData.poll.options];
      updatedOptions[optionIndex].votes += 1;

      // Guardamos los cambios
      await Promise.all([
        updateDoc(postRef, {
          "poll.options": updatedOptions,
        }),
        setDoc(voteRef, {
          optionIndex,
          timestamp: serverTimestamp(),
        }),
      ]);

      await mutate();
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    console.log("Liking post:", postId);

    try {
      // Optimistically update the UI
      mutate(
        (currentPosts?: FirebasePost[]) => {
          if (!currentPosts) return currentPosts;
          return currentPosts.map(post => {
            if (post.id === postId) {
              const hasLiked = post.likes.includes(user.id);
              return {
                ...post,
                likes: hasLiked 
                  ? post.likes.filter(id => id !== user.id)
                  : [...post.likes, user.id]
              };
            }
            return post;
          });
        },
        false // Don't revalidate immediately
      );

      // Update Firestore in the background
      const postRef = doc(db, "posts", postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) return;

      const data = postDoc.data();
      const currentLikes = Array.isArray(data.likes) ? data.likes : [];
      const hasLiked = currentLikes.includes(user.id);

      await updateDoc(postRef, {
        likes: hasLiked
          ? currentLikes.filter((id: string) => id !== user.id)
          : [...currentLikes, user.id]
      });

      // Revalidate after the update to ensure consistency
      await mutate();
    } catch (error) {
      console.error("Error toggling like:", error);
      // If there's an error, revalidate to restore the correct state
      await mutate();
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user || !newComment.trim()) return;
    console.log("Adding comment to post:", postId);
    setIsSubmittingComment(true);

    try {
      // Primero obtenemos el número de apartamento actualizado del usuario
      const userDoc = await getDoc(doc(db, "users", user.id));
      const userAptNumber = userDoc.exists() ? userDoc.data().aptNumber : "Not set";

      const postRef = doc(db, "posts", postId);
      const newCommentData: Comment = {
        id: crypto.randomUUID(),
        author: {
          name: user.name,
          avatar: user.avatar,
          initials: user.initials,
          aptNumber: userAptNumber,  // Usamos el número de apartamento obtenido de Firestore
          isEmojiAvatar: user.isEmojiAvatar,
        },
        content: newComment.trim(),
        timestamp: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
      };

      await updateDoc(postRef, {
        comments: arrayUnion(newCommentData)
      });

      setNewComment("");
      await mutate();
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  /* ------------------------------------------------------------
     Render
  ------------------------------------------------------------ */
  return (
    <div className="container mx-auto px-4 py-2 md:py-8 pb-36">
      {(isRefreshing || isPulling) && (
        <div className="fixed top-16 left-0 right-0 z-50 flex justify-center">
          <div className="flex items-center space-x-2 rounded-full bg-indigo-700 px-4 py-2 text-white shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Refreshing...</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {posts?.map((post) => (
          <Card key={post.id}>
            <CardHeader className="flex flex-row items-center space-x-4 p-4">
              <Avatar className={cn(
                "h-8 w-8 overflow-visible",
                post.author.isEmojiAvatar ? "bg-transparent border-0 !rounded-none" : undefined
              )}>
                <AvatarImage 
                  src={post.author.avatar} 
                  className={cn(
                    "object-contain",
                    post.author.isEmojiAvatar && "transform scale-[1.2] !rounded-none"
                  )}
                />
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
                    {post.poll.options.map((option, index) => {
                      const totalVotes = post.poll!.options.reduce(
                        (acc, opt) => acc + opt.votes,
                        0
                      );
                      const percentage =
                        totalVotes > 0
                          ? (option.votes / totalVotes) * 100
                          : 0;

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
                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full bg-indigo-600"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="text-sm text-gray-500">
                            {option.votes} votes (
                            {percentage.toFixed(1)}%)
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`space-x-2 ${post.likes?.includes(user?.id || '') ? 'text-indigo-600' : ''}`}
                  onClick={() => handleLike(post.id)}
                >
                  <ThumbsUp className={`h-4 w-4 ${post.likes?.includes(user?.id || '') ? 'fill-current' : ''}`} />
                  <span>{Array.isArray(post.likes) ? post.likes.length : 0}</span>
                </Button>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="space-x-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comments?.length || 0}</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-lg">
                    <SheetHeader>
                      <SheetTitle>Post Details</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col h-full">
                      {/* Post Preview */}
                      <div className="border-b pb-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className={cn(
                            "h-8 w-8 overflow-visible",
                            post.author.isEmojiAvatar ? "bg-transparent border-0 !rounded-none" : undefined
                          )}>
                            <AvatarImage 
                              src={post.author.avatar} 
                              className={cn(
                                "object-contain",
                                post.author.isEmojiAvatar && "transform scale-[1.2] !rounded-none"
                              )}
                            />
                            <AvatarFallback>{post.author.initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{post.author.name}</div>
                            <div className="text-sm text-gray-500">
                              <span>{post.timestamp}</span>
                              <span> • </span>
                              <span>APT {post.author.aptNumber}</span>
                            </div>
                          </div>
                        </div>
                        <p className="mt-3 text-gray-700">{post.content}</p>
                        <div className="mt-4 flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`space-x-2 ${post.likes?.includes(user?.id || '') ? 'text-indigo-600' : ''}`}
                            onClick={() => handleLike(post.id)}
                          >
                            <ThumbsUp className={`h-4 w-4 ${post.likes?.includes(user?.id || '') ? 'fill-current' : ''}`} />
                            <span>{Array.isArray(post.likes) ? post.likes.length : 0}</span>
                          </Button>
                        </div>
                      </div>

                      <div className="py-4 border-b">
                        <h2 className="font-semibold text-lg">Comments</h2>
                      </div>

                      <ScrollArea className="flex-1 pr-4 -mr-4">
                        <div className="space-y-4 py-4">
                          {post.comments?.map((comment) => (
                            <div key={comment.id} className="flex space-x-3">
                              <Avatar className={cn(
                                "h-8 w-8 overflow-visible",
                                comment.author.isEmojiAvatar ? "bg-transparent border-0 !rounded-none" : undefined
                              )}>
                                <AvatarImage 
                                  src={comment.author.avatar} 
                                  className={cn(
                                    "object-contain",
                                    comment.author.isEmojiAvatar && "transform scale-[1.2] !rounded-none"
                                  )}
                                />
                                <AvatarFallback>{comment.author.initials}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{comment.author.name}</span>
                                  <span className="text-sm text-gray-500">APT {comment.author.aptNumber}</span>
                                </div>
                                <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                                <span className="text-xs text-gray-500 mt-1">
                                  {format(new Date(comment.timestamp), 'MMM d, yyyy h:mm a')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="border-t pt-4 mt-auto pb-6">
                        <div className="flex space-x-2">
                          <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="min-h-[80px]"
                          />
                          <Button 
                            onClick={() => handleAddComment(post.id)}
                            disabled={!newComment.trim() || isSubmittingComment}
                            className="self-end"
                          >
                            {isSubmittingComment ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Post'
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <motion.button
            onClick={() => setIsDialogOpen(true)}
            whileTap={{ scale: 0.9 }}
            className="fixed right-6 bottom-28 bg-indigo-600 text-white rounded-full p-4 shadow-lg z-50 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-8 w-8" />
          </motion.button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
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
                        onChange={(e) =>
                          setPollQuestion(e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                        placeholder="Ask a question..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Options</Label>
                      {pollOptions.map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="text"
                            value={option.label}
                            onChange={(e) =>
                              handlePollOptionChange(
                                index,
                                e.target.value
                              )
                            }
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
              {/* Añade más opciones si lo deseas */}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreatePost}
                disabled={
                  (!newPostContent.trim() && !isPoll) ||
                  (isPoll &&
                    (!pollQuestion.trim() ||
                      pollOptions.filter((opt) => opt.label.trim())
                        .length < 2))
                }
                className="min-w-[80px]"
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Post"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
