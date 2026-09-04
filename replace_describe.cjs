const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/routes/_authenticated/report.new.tsx');
let content = fs.readFileSync(file, 'utf8');

const targetStr = `            <section className="card-soft rounded-3xl p-6 sm:p-8 space-y-5">
              <div className="flex items-start gap-3">
                <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shrink-0">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-primary-dark">
                    وصف البلاغ بالذكاء الاصطناعي
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    اكتب ما حدث بلغتك الطبيعية وسنستخرج التفاصيل تلقائياً.
                  </p>
                </div>
              </div>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={7}
                  maxLength={2000}
                  placeholder={"مثال:\\nفقدت حقيبة سوداء في صنعاء وبداخلها لابتوب."}
                  className="w-full resize-none rounded-2xl border-2 border-border bg-background p-4 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition"
                  dir="rtl"
                />
                <div className="absolute bottom-3 left-4 text-[11px] font-medium text-muted-foreground">
                  {description.length} / 2000
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={analyze}
                  disabled={analyzing}
                  className="btn-gradient inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-extrabold disabled:opacity-60"
                >
                  {analyzing ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Sparkles className="size-5" />
                  )}
                  {analyzing ? "جاري التحليل..." : "تحليل الوصف بالذكاء الاصطناعي"}
                </button>
                <button
                  type="button"
                  onClick={skipAi}
                  disabled={analyzing}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/60 px-6 py-4 text-sm font-bold text-primary-dark hover:bg-secondary"
                >
                  تخطي والمتابعة يدوياً
                </button>
              </div>
            </section>`;

const newStr = `            {!isHumanitarian ? (
              <section className="card-soft rounded-3xl p-6 sm:p-8 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shrink-0">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-primary-dark">
                      وصف البلاغ بالذكاء الاصطناعي
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      اكتب ما حدث بلغتك الطبيعية وسنستخرج التفاصيل تلقائياً.
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={7}
                    maxLength={2000}
                    placeholder={"مثال:\\nفقدت حقيبة سوداء في صنعاء وبداخلها لابتوب."}
                    className="w-full resize-none rounded-2xl border-2 border-border bg-background p-4 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition"
                    dir="rtl"
                  />
                  <div className="absolute bottom-3 left-4 text-[11px] font-medium text-muted-foreground">
                    {description.length} / 2000
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={analyze}
                    disabled={analyzing}
                    className="btn-gradient inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-extrabold disabled:opacity-60"
                  >
                    {analyzing ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <Sparkles className="size-5" />
                    )}
                    {analyzing ? "جاري التحليل..." : "تحليل الوصف بالذكاء الاصطناعي"}
                  </button>
                  <button
                    type="button"
                    onClick={skipAi}
                    disabled={analyzing}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/60 px-6 py-4 text-sm font-bold text-primary-dark hover:bg-secondary"
                  >
                    تخطي والمتابعة يدوياً
                  </button>
                </div>
              </section>
            ) : (
              <section className="card-soft rounded-3xl border-2 border-red-200 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/10 p-6 sm:p-8 space-y-8">
                {/* 1. Identity & Biometrics */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-red-950 dark:text-red-200 flex items-center gap-2">
                    <span className="bg-red-100 dark:bg-red-900/50 p-1.5 rounded-lg text-red-600"><AlertCircle className="size-4"/></span>
                    بطاقة الهوية والبيانات الحيوية
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="الاسم الكامل أو اللقب المعروف به *">
                      <input
                        className="input"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="اسم المفقود..."
                      />
                    </Field>
                    <Field label="العمر التقريبي بالسنوات *">
                      <input
                        type="number"
                        className="input"
                        value={form.age}
                        onChange={(e) => setForm({ ...form, age: e.target.value })}
                        placeholder="مثال: 12"
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs font-black text-foreground">الفئة والجنس *</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: "child_m", label: "طفل", cat: "child", gender: "male" },
                          { id: "child_f", label: "طفلة", cat: "child", gender: "female" },
                          { id: "youth_m", label: "شاب", cat: "youth", gender: "male" },
                          { id: "youth_f", label: "شابة", cat: "youth", gender: "female" },
                          { id: "elderly_m", label: "مسن", cat: "elderly", gender: "male" },
                          { id: "elderly_f", label: "مسنة", cat: "elderly", gender: "female" },
                        ].map((btn) => {
                          const isActive = form.human_category === btn.cat && form.gender === btn.gender;
                          return (
                            <button
                              key={btn.id}
                              type="button"
                              onClick={() => setForm({ ...form, human_category: btn.cat as any, gender: btn.gender })}
                              className={\`rounded-xl border px-4 py-2 text-sm font-bold transition \${
                                isActive
                                  ? "border-red-600 bg-red-600 text-white"
                                  : "border-border bg-background text-muted-foreground hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/50"
                              }\`}
                            >
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Appearance & Speech */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-red-950 dark:text-red-200 flex items-center gap-2">
                    <span className="bg-red-100 dark:bg-red-900/50 p-1.5 rounded-lg text-red-600"><Eye className="size-4"/></span>
                    بطاقة المظهر وقت الاختفاء
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Field label="الملابس التي كان يرتديها وقت الخروج *">
                        <textarea
                          rows={2}
                          className="input"
                          value={form.clothes_description}
                          onChange={(e) => setForm({ ...form, clothes_description: e.target.value })}
                          placeholder="لون الثوب، الشال، الحذاء..."
                        />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs font-black text-foreground">اللغة وطريقة التخاطب</label>
                      <div className="flex flex-wrap gap-2">
                        {["ينطق بطلاقة", "تلعثم / ثقل باللسان", "لا يتكلم / أبكم", "لغة إشارة", "غير معروف"].map((manner) => (
                          <button
                            key={manner}
                            type="button"
                            onClick={() => setForm({ ...form, speech_manner: manner })}
                            className={\`rounded-xl border px-4 py-2 text-xs font-bold transition \${
                              form.speech_manner === manner
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-muted-foreground hover:bg-secondary"
                            }\`}
                          >
                            {manner}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Medical & Psychological Alert */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-red-950 dark:text-red-200 flex items-center gap-2">
                    <span className="bg-red-100 dark:bg-red-900/50 p-1.5 rounded-lg text-red-600"><HandHeart className="size-4"/></span>
                    البطاقة الطبية والحالة الصحية
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-xs font-black text-foreground">الحالة الصحية (خيارات سريعة)</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {["سليم صحياً", "زهايمر / فقدان ذاكرة", "طيف توحد", "سكري / يحتاج علاج", "اضطراب نفسي"].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setForm({ ...form, health_status_quick: h })}
                            className={\`rounded-xl border px-3 py-1.5 text-xs font-bold transition \${
                              form.health_status_quick === h
                                ? "border-rose-600 bg-rose-600 text-white"
                                : "border-border bg-background text-muted-foreground hover:bg-rose-50"
                            }\`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                      <Field label="تفاصيل طبية أخرى (إن وجدت)">
                        <input
                          className="input"
                          value={form.health_condition}
                          onChange={(e) => setForm({ ...form, health_condition: e.target.value })}
                          placeholder="أي تفاصيل مهمة..."
                        />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="تعليمات خاصة عند العثور عليه">
                        <textarea
                          rows={2}
                          className="input"
                          value={form.special_instructions}
                          onChange={(e) => setForm({ ...form, special_instructions: e.target.value })}
                          placeholder="كيفية تهدئته، التعامل معه، أو ما يجب تجنبه..."
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                {/* 4. Time, Location & Emergency */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-red-950 dark:text-red-200 flex items-center gap-2">
                    <span className="bg-red-100 dark:bg-red-900/50 p-1.5 rounded-lg text-red-600"><MapPin className="size-4"/></span>
                    زمان ومكان الفقدان وأرقام الطوارئ
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="المحافظة *">
                      <select
                        className="input"
                        value={form.governorate_id ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, governorate_id: e.target.value ? Number(e.target.value) : null })
                        }
                      >
                        <option value="">— اختر المحافظة —</option>
                        {governorates.map((g) => (
                          <option key={g.id} value={g.id}>{g.name_ar}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="المديرية *">
                      <select
                        className="input"
                        value={form.district_id ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, district_id: e.target.value ? Number(e.target.value) : null })
                        }
                      >
                        <option value="">— اختر المديرية —</option>
                        {districts?.map((d) => (
                          <option key={d.id} value={d.id}>{d.name_ar}</option>
                        ))}
                      </select>
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="اسم الشارع / الحي / أقرب معلم بدقة *">
                        <input
                          className="input"
                          value={form.location_text}
                          onChange={(e) => setForm({ ...form, location_text: e.target.value })}
                          placeholder="مثال: جولة كذا، بجوار مستشفى كذا..."
                        />
                      </Field>
                    </div>
                    <Field label="تاريخ الاختفاء *">
                      <input
                        type="date"
                        className="input"
                        value={form.incident_date}
                        onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
                      />
                    </Field>
                    <Field label="ساعة الاختفاء (تقريبية)">
                      <input
                        type="time"
                        className="input"
                        value={form.incident_time}
                        onChange={(e) => setForm({ ...form, incident_time: e.target.value })}
                      />
                    </Field>
                    <Field label="رقم هاتف الطوارئ الأساسي *">
                      <input
                        type="tel"
                        dir="ltr"
                        className="input font-mono"
                        value={form.emergency_phone}
                        onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })}
                        placeholder="770000000"
                      />
                    </Field>
                    <Field label="رقم هاتف بديل">
                      <input
                        type="tel"
                        dir="ltr"
                        className="input font-mono"
                        value={form.alt_emergency_phone}
                        onChange={(e) => setForm({ ...form, alt_emergency_phone: e.target.value })}
                        placeholder="710000000"
                      />
                    </Field>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      // Skip describing and go straight to review for Humanitarian
                      setStep("review");
                    }}
                    className="btn-primary inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-extrabold"
                  >
                    متابعة <ArrowLeft className="size-4" />
                  </button>
                </div>
              </section>
            )}`;

if (content.includes("وصف البلاغ بالذكاء الاصطناعي")) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log("Successfully replaced the describe section.");
} else {
  console.log("Could not find the target string.");
}
