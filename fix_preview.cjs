const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/routes/_authenticated/report.new.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Update PreviewCard Props definition
const propsRegex = /function PreviewCard\(\{[\s\S]*?\}\) \{/;
const newProps = `function PreviewCard({
  type,
  title,
  description,
  category,
  governorate,
  district,
  location,
  incidentDate,
  incidentTime,
  keywords,
  secretVerificationMark,
  rewardAmount,
  images,
  isHumanitarian,
  humanCategory,
  age,
  gender,
  clothesDescription,
  speechManner,
  healthCondition,
  specialInstructions,
  emergencyPhone,
  altEmergencyPhone,
}: {
  type: ReportType;
  title: string;
  description: string;
  category: string | null;
  governorate: string | null;
  district: string | null;
  location: string;
  incidentDate: string;
  incidentTime?: string;
  keywords: string[];
  secretVerificationMark?: string;
  rewardAmount?: number | null;
  images: LocalImage[];
  isHumanitarian?: boolean;
  humanCategory?: string;
  age?: string;
  gender?: string;
  clothesDescription?: string;
  speechManner?: string;
  healthCondition?: string;
  specialInstructions?: string;
  emergencyPhone?: string;
  altEmergencyPhone?: string;
}) {`;

content = content.replace(propsRegex, newProps);

// 2. Add the Poster UI if isHumanitarian
const returnTarget = `  return (
    <section className="card-soft overflow-hidden rounded-3xl">`;

const posterUI = `  const loc = [governorate, district, location].filter(Boolean).join(" - ");
  if (isHumanitarian) {
    return (
      <div className="mx-auto max-w-2xl bg-white text-black border-4 border-red-600 rounded-3xl overflow-hidden shadow-2xl font-sans relative">
        {/* Header */}
        <div className="bg-red-600 text-white text-center py-4 px-6 relative">
          <div className="absolute top-4 right-6 animate-pulse">
            <AlertTriangle className="size-10" />
          </div>
          <div className="absolute top-4 left-6 animate-pulse">
            <AlertTriangle className="size-10" />
          </div>
          <h1 className="text-4xl font-black mb-1">نداء إنساني عاجل</h1>
          <h2 className="text-xl font-bold tracking-widest uppercase">MISSING PERSON</h2>
        </div>
        
        {/* Body */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {images.length > 0 ? (
              <img src={images[0].url} className="w-full md:w-1/2 rounded-2xl object-cover aspect-square border-4 border-gray-100 shadow-md" />
            ) : (
              <div className="w-full md:w-1/2 aspect-square bg-gray-100 rounded-2xl border-4 border-gray-200 flex items-center justify-center text-gray-400">
                <ImageIcon className="size-20 opacity-20" />
              </div>
            )}
            
            <div className="w-full md:w-1/2 space-y-4">
              <div>
                <h3 className="text-3xl font-black text-red-700 leading-tight mb-2">{title || "الاسم غير معروف"}</h3>
                <div className="inline-flex gap-2">
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-sm font-bold">
                    {humanCategory === "child" ? "طفل" : humanCategory === "elderly" ? "مسن" : "شاب/ـة"}
                  </span>
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-sm font-bold">
                    {gender === "female" ? "أنثى" : gender === "male" ? "ذكر" : ""}
                  </span>
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-sm font-bold">
                    العمر: {age || "غير محدد"}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex gap-2 border-b border-gray-100 pb-2">
                  <span className="font-bold text-gray-500 w-24 shrink-0">الملابس:</span>
                  <span className="font-bold">{clothesDescription || "غير محدد"}</span>
                </div>
                {speechManner && (
                  <div className="flex gap-2 border-b border-gray-100 pb-2">
                    <span className="font-bold text-gray-500 w-24 shrink-0">التخاطب:</span>
                    <span className="font-bold">{speechManner}</span>
                  </div>
                )}
                {healthCondition && (
                  <div className="flex gap-2 border-b border-gray-100 pb-2">
                    <span className="font-bold text-rose-600 w-24 shrink-0">حالة صحية:</span>
                    <span className="font-bold text-rose-700">{healthCondition}</span>
                  </div>
                )}
                <div className="flex gap-2 border-b border-gray-100 pb-2">
                  <span className="font-bold text-gray-500 w-24 shrink-0">موقع الفقدان:</span>
                  <span className="font-bold">{loc}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold text-gray-500 w-24 shrink-0">تاريخ الاختفاء:</span>
                  <span className="font-bold">{incidentDate} {incidentTime}</span>
                </div>
              </div>
            </div>
          </div>
          
          {specialInstructions && (
            <div className="bg-rose-50 text-rose-800 p-4 rounded-2xl border border-rose-200">
              <h4 className="font-black text-rose-900 mb-1 flex items-center gap-2">
                <AlertCircle className="size-4" /> تعليمات هامة عند العثور عليه
              </h4>
              <p className="font-bold text-sm leading-relaxed">{specialInstructions}</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-900 text-white p-6 text-center space-y-2">
          <p className="text-gray-400 font-bold text-sm mb-2">للإدلاء بأي معلومات، يرجى الاتصال فوراً:</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-3xl font-black font-mono tracking-widest" dir="ltr">
            <span className="bg-red-600 px-6 py-2 rounded-xl">{emergencyPhone || "---"}</span>
            {altEmergencyPhone && (
              <span className="bg-gray-800 px-6 py-2 rounded-xl">{altEmergencyPhone}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="card-soft overflow-hidden rounded-3xl">`;

const returnRegex = /  const loc = \[governorate, district, location\]\.filter\(Boolean\)\.join\(" - "\);\n  return \(\n    <section className="card-soft overflow-hidden rounded-3xl">/;
content = content.replace(returnRegex, posterUI);

fs.writeFileSync(file, content, 'utf8');
console.log("Successfully fixed PreviewCard section.");
