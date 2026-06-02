import { Briefcase, Building2, MapPin, DollarSign, Clock, Users } from "lucide-react";

export function Jobs() {
  const jobs = [
    {
      id: 1,
      title: "Senior Frontend Engineer",
      company: "TechCorp India",
      location: "Hybrid (Bangalore)",
      type: "Full-time",
      salary: "₹25L - ₹35L",
      postedBy: "Rahul Verma (Tower A)",
      isReferral: true,
      posted: "2 days ago"
    },
    {
      id: 2,
      title: "Product Marketing Manager",
      company: "GrowthX",
      location: "Remote",
      type: "Full-time",
      salary: "₹18L - ₹24L",
      postedBy: "Neha Singh (Villa 12)",
      isReferral: true,
      posted: "5 days ago"
    },
    {
      id: 3,
      title: "Part-time Math Tutor",
      company: "Local Learning Center",
      location: "On-site (Community Club)",
      type: "Part-time",
      salary: "₹500/hr",
      postedBy: "Community Admin",
      isReferral: false,
      posted: "1 week ago"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Jobs & Referrals</h1>
          <p className="text-slate-500 text-sm mt-1">Leverage your community network for career growth.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
            Upload Resume
          </button>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
            Post a Job
          </button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">42</div>
            <div className="text-xs text-slate-500 font-medium">Active Jobs</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">18</div>
            <div className="text-xs text-slate-500 font-medium">Referrals Available</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">156</div>
            <div className="text-xs text-slate-500 font-medium">Companies Network</div>
          </div>
        </div>
      </div>

      {/* Job List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
        <div className="p-4 bg-slate-50/50 rounded-t-xl border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recent Postings</h2>
          <button className="text-sm text-indigo-600 font-medium">View All</button>
        </div>
        
        {jobs.map((job) => (
          <div key={job.id} className="p-5 hover:bg-slate-50 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                  {job.isReferral && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                      Referral Available
                    </span>
                  )}
                </div>
                <div className="text-slate-600 font-medium text-sm mb-3">{job.company}</div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" /> {job.location}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" /> {job.type}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-slate-400" /> {job.salary}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-start sm:items-end gap-3 sm:w-48">
                <button className="w-full sm:w-auto px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm font-medium rounded-lg transition-colors">
                  {job.isReferral ? "Ask for Referral" : "Apply Now"}
                </button>
                <div className="text-xs text-slate-400 text-left sm:text-right">
                  Posted by {job.postedBy} • {job.posted}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
