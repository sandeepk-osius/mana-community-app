import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function MedicalDirectory() {
  const doctors = [
    { id: 1, name: 'Dr. Ananya Sharma', spec: 'Pediatrician', rating: 4.8, fee: 800, exp: '12 Yrs', dist: '0.8 km' },
    { id: 2, name: 'Dr. Vikram Reddy', spec: 'Cardiologist', rating: 4.9, fee: 1500, exp: '20 Yrs', dist: '2.1 km' }
  ];

  return (
    <div className={cn("w-full max-w-4xl mx-auto my-8 space-y-6")}>
      <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-lg flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black mb-2">Health Directory</h2>
          <p className="text-blue-100 font-medium">Verified by your neighbors</p>
        </div>
        <div className="text-6xl opacity-80">⚕️</div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {doctors.map(d => (
          <div key={d.id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex gap-5 hover:shadow-md transition cursor-pointer">
            <div className="w-16 h-16 bg-blue-50 text-3xl flex items-center justify-center rounded-2xl border border-blue-100">👨‍⚕️</div>
            <div className="flex-1">
              <div className="flex justify-between">
                <h3 className="font-black text-lg text-stone-900">{d.name}</h3>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">📍 {d.dist}</span>
              </div>
              <p className="text-sm font-bold text-blue-600 uppercase tracking-wider mt-1">{d.spec}</p>
              <p className="text-sm text-stone-500 my-2">{d.exp} Experience</p>
              <div className="flex justify-between items-center border-t border-stone-100 pt-3 mt-3">
                <span className="font-bold text-amber-500">★ {d.rating}</span>
                <span className="font-black text-stone-800">
                  ₹{d.fee}
                  <button className="ml-3 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700">Book</button>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
