import { CalendarDays, MapPin, Users, Bell } from "lucide-react";

export function Events() {
  const events = [
    {
      id: 1,
      title: "Class of 2016 Reunion (CS Dept)",
      date: "May 15, 2026",
      time: "6:00 PM - 10:00 PM",
      location: "Main Auditorium, Campus",
      attendees: 145,
      type: "Reunion",
      image: "https://images.unsplash.com/photo-1523580494112-071dcb85170d?auto=format&fit=crop&q=80&w=600&h=300"
    },
    {
      id: 2,
      title: "Community Diwali Mela Planning Meeting",
      date: "Oct 10, 2026",
      time: "10:00 AM - 12:00 PM",
      location: "Clubhouse Conference Room",
      attendees: 32,
      type: "Community Event",
      image: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80&w=600&h=300"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Events & Reunions</h1>
          <p className="text-slate-500 text-sm mt-1">Discover and organize meetups within your community.</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
          + Create Event
        </button>
      </div>

      {/* Featured Event Card */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl overflow-hidden shadow-lg relative">
        <div className="absolute inset-0 bg-black/20 mix-blend-multiply"></div>
        <div className="relative p-6 sm:p-10 flex flex-col sm:flex-row gap-6 items-center">
          <div className="flex-1 text-white">
            <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wider text-white/90 mb-4 inline-block">
              Upcoming Mega Event
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Annual Tech Alumni Meetup</h2>
            <p className="text-white/80 max-w-lg mb-6 leading-relaxed">
              Join us for the biggest networking event of the year. Connect with fellow alumni, attend workshops, and enjoy the gala dinner.
            </p>
            <div className="flex flex-wrap gap-4 text-sm font-medium text-white/90 mb-8">
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur">
                <CalendarDays className="w-4 h-4" /> Aug 20, 2026
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur">
                <MapPin className="w-4 h-4" /> Grand Hotel Convention Center
              </div>
            </div>
            <button className="px-6 py-3 bg-white text-indigo-700 hover:bg-slate-50 font-bold rounded-lg transition-colors shadow-sm">
              RSVP Now
            </button>
          </div>
          <div className="hidden sm:block w-1/3">
            <div className="aspect-square bg-white/10 rounded-2xl border border-white/20 p-6 flex flex-col justify-center items-center text-center backdrop-blur shadow-2xl">
              <div className="text-5xl font-black text-white mb-2">350+</div>
              <div className="text-white/80 font-medium uppercase tracking-widest text-sm">Registered Guests</div>
              <div className="mt-6 flex -space-x-3">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-indigo-500 bg-slate-200"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Upcoming Schedule</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col sm:flex-row group hover:shadow-md transition-all">
            <div className="sm:w-48 h-48 sm:h-auto relative">
              <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-xs font-bold text-white uppercase tracking-wider">
                {event.type}
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h4 className="font-bold text-lg text-slate-900 mb-2 line-clamp-1">{event.title}</h4>
              
              <div className="space-y-2 text-sm text-slate-600 mb-4 flex-1">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-indigo-500" /> {event.date} • {event.time}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-500" /> {event.location}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" /> {event.attendees} Attending
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                <button className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg transition-colors">
                  View Details
                </button>
                <button className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors" title="Set Reminder">
                  <Bell className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
