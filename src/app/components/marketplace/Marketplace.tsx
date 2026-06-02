import { Search, Tag, MapPin, CheckCircle } from "lucide-react";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Marketplace() {
  const [activeCategory, setActiveCategory] = useState("All");
  
  const categories = ["All", "Homemade Food", "Electronics", "Vehicles", "Real Estate", "Services"];
  
  const listings = [
    {
      id: 1,
      title: "Authentic Hyderabadi Chicken Biryani",
      price: "$15 / portion",
      category: "Homemade Food",
      seller: "Mrs. Fatima",
      verified: true,
      location: "Tower B, Apt 402",
      image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=400&h=300",
      description: "Taking pre-orders for Sunday lunch. Made with authentic spices and premium basmati rice."
    },
    {
      id: 2,
      title: "PlayStation 5 - Barely Used",
      price: "$400",
      category: "Electronics",
      seller: "Karan S.",
      verified: true,
      location: "Tower A, Apt 1205",
      image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=400&h=300",
      description: "Selling my PS5 disc edition. Comes with 2 controllers and 3 games. Moving out soon."
    },
    {
      id: 3,
      title: "Trek Mountain Bike (Adult)",
      price: "$250",
      category: "Vehicles",
      seller: "David M.",
      verified: true,
      location: "Villa 45",
      image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=400&h=300",
      description: "Excellent condition, recently serviced. Perfect for weekend trails."
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Community Marketplace</h1>
          <p className="text-slate-500 text-sm mt-1">Buy and sell trusted items within your community.</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm self-start md:self-auto">
          + Post Ad
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search for biryani, bikes, laptops..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                activeCategory === cat
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <div className="h-48 relative overflow-hidden bg-slate-100">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm">
                {item.price}
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium mb-1">
                <Tag className="w-3 h-3" /> {item.category}
              </div>
              <h3 className="font-bold text-slate-900 text-lg leading-tight mb-2">{item.title}</h3>
              <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">{item.description}</p>
              
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                    {item.seller.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-900 flex items-center gap-1">
                      {item.seller} {item.verified && <CheckCircle className="w-3 h-3 text-green-500" />}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" /> {item.location}
                    </div>
                  </div>
                </div>
                <button className="text-indigo-600 text-sm font-medium hover:text-indigo-700">
                  Contact
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
