import { MessageSquare, Heart, Share2, MoreHorizontal, Image as ImageIcon, CheckCircle } from "lucide-react";
import { useState } from "react";

export function Feed() {
  const [posts] = useState([
    {
      id: 1,
      author: "Priya Sharma",
      avatar: "PS",
      role: "Admin",
      time: "2 hours ago",
      content: "Important Announcement: The community pool maintenance is complete. It will be open starting tomorrow at 6:00 AM. Please ensure you carry your NexusApp ID for entry.",
      likes: 45,
      comments: 12,
      isOfficial: true,
    },
    {
      id: 2,
      author: "Rahul Verma",
      avatar: "RV",
      role: "Verified Member",
      time: "5 hours ago",
      content: "Does anyone have a recommendation for a reliable AC repair mechanic in the neighborhood? Need it urgently.",
      likes: 5,
      comments: 8,
      isOfficial: false,
    },
    {
      id: 3,
      author: "Anita Desai",
      avatar: "AD",
      role: "Verified Member",
      time: "Yesterday",
      content: "Hosting a mini potluck this weekend at the central park gazebo. Anyone interested in bringing desserts? 🍰",
      likes: 22,
      comments: 15,
      isOfficial: false,
    }
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Create Post */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex gap-4">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-700 font-semibold">
            AJ
          </div>
          <div className="flex-1 space-y-3">
            <textarea
              className="w-full bg-slate-50 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              placeholder="Share an update, ask a question, or post a poll..."
              rows={2}
            ></textarea>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium">
                  <ImageIcon className="w-4 h-4" /> Photo
                </button>
              </div>
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Items */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                  {post.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-900">{post.author}</span>
                    {post.isOfficial && <CheckCircle className="w-4 h-4 text-green-500" />}
                  </div>
                  <div className="flex items-center text-xs text-slate-500 gap-2">
                    <span className={post.isOfficial ? "text-indigo-600 font-medium" : ""}>{post.role}</span>
                    <span>•</span>
                    <span>{post.time}</span>
                  </div>
                </div>
              </div>
              <button className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-800 text-sm mb-4 whitespace-pre-line leading-relaxed">
              {post.content}
            </p>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-slate-500 text-sm">
              <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                <Heart className="w-4 h-4" /> {post.likes}
              </button>
              <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                <MessageSquare className="w-4 h-4" /> {post.comments} Comments
              </button>
              <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
