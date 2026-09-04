const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/routes/_authenticated/report.new.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Hide the old fields if isHumanitarian
const oldFieldsStr = `              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="اسم المفقود / العنوان">
                  <input
                    className="input"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="مثال: حقيبة سوداء"
                  />
                </Field>
                <Field label="التصنيف">
                  <select
                    className="input"
                    value={form.category_id ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category_id: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  >
                    <option value="">— اختر —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_ar}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="اللون">
                  <input
                    className="input"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    placeholder="أسود، أحمر..."
                  />
                </Field>
                <Field label="العلامة التجارية">
                  <input
                    className="input"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="Apple، Samsung..."
                  />
                </Field>
                <Field label="المحافظة">
                  <select
                    className="input"
                    value={form.governorate_id ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        governorate_id: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  >
                    <option value="">— اختر المحافظة —</option>
                    {governorates.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name_ar}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="المديرية">
                  <select
                    className="input"
                    value={form.district_id ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        district_id: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  >
                    <option value="">— اختر المديرية —</option>
                    {districts?.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name_ar}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="الموقع الدقيق">
                    <input
                      className="input"
                      value={form.location_text}
                      onChange={(e) => setForm({ ...form, location_text: e.target.value })}
                      placeholder="وصف إضافي لمكان الفقدان..."
                    />
                  </Field>
                </div>
                <Field label="تاريخ الحادثة">
                  <input
                    type="date"
                    className="input"
                    value={form.incident_date}
                    onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
                  />
                </Field>
                <Field label="طريقة التواصل المفضلة">
                  <select
                    className="input"
                    value={form.contact_preference}
                    onChange={(e) => setForm({ ...form, contact_preference: e.target.value as any })}
                  >
                    <option value="in_app">رسائل داخل التطبيق فقط</option>
                    <option value="phone">اتصال هاتفي فقط</option>
                    <option value="both">كلاهما</option>
                  </select>
                </Field>
                <Field label="كلمات مفتاحية" className="sm:col-span-2">
                  <div className="flex flex-wrap gap-2 rounded-xl border-2 border-border bg-background p-2">
                    {form.keywords.map((k) => (
                      <span
                        key={k}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"
                      >
                        {k}
                        <button
                          type="button"
                          onClick={() => removeKeyword(k)}
                          className="rounded-full hover:bg-primary/20"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addKeyword();
                        }
                      }}
                      className="flex-1 min-w-32 bg-transparent px-2 py-1 text-sm outline-none"
                      placeholder="أضف كلمة واضغط Enter"
                    />
                  </div>
                </Field>
                <Field label="ملاحظات إضافية" className="sm:col-span-2">
                  <textarea
                    className="input min-h-24"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="أي تفاصيل إضافية تساعد في التعرف"
                  />
                </Field>
              </div>`;

const newFieldsStr = `              {!isHumanitarian && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="اسم المفقود / العنوان">
                    <input
                      className="input"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="مثال: حقيبة سوداء"
                    />
                  </Field>
                  <Field label="التصنيف">
                    <select
                      className="input"
                      value={form.category_id ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          category_id: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                    >
                      <option value="">— اختر —</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name_ar}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="اللون">
                    <input
                      className="input"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      placeholder="أسود، أحمر..."
                    />
                  </Field>
                  <Field label="العلامة التجارية">
                    <input
                      className="input"
                      value={form.brand}
                      onChange={(e) => setForm({ ...form, brand: e.target.value })}
                      placeholder="Apple، Samsung..."
                    />
                  </Field>
                  <Field label="المحافظة">
                    <select
                      className="input"
                      value={form.governorate_id ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          governorate_id: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                    >
                      <option value="">— اختر المحافظة —</option>
                      {governorates.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name_ar}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="المديرية">
                    <select
                      className="input"
                      value={form.district_id ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          district_id: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                    >
                      <option value="">— اختر المديرية —</option>
                      {districts?.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name_ar}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="الموقع الدقيق">
                      <input
                        className="input"
                        value={form.location_text}
                        onChange={(e) => setForm({ ...form, location_text: e.target.value })}
                        placeholder="وصف إضافي لمكان الفقدان..."
                      />
                    </Field>
                  </div>
                  <Field label="تاريخ الحادثة">
                    <input
                      type="date"
                      className="input"
                      value={form.incident_date}
                      onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
                    />
                  </Field>
                  <Field label="طريقة التواصل المفضلة">
                    <select
                      className="input"
                      value={form.contact_preference}
                      onChange={(e) => setForm({ ...form, contact_preference: e.target.value as any })}
                    >
                      <option value="in_app">رسائل داخل التطبيق فقط</option>
                      <option value="phone">اتصال هاتفي فقط</option>
                      <option value="both">كلاهما</option>
                    </select>
                  </Field>
                  <Field label="كلمات مفتاحية" className="sm:col-span-2">
                    <div className="flex flex-wrap gap-2 rounded-xl border-2 border-border bg-background p-2">
                      {form.keywords.map((k) => (
                        <span
                          key={k}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"
                        >
                          {k}
                          <button
                            type="button"
                            onClick={() => removeKeyword(k)}
                            className="rounded-full hover:bg-primary/20"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addKeyword();
                          }
                        }}
                        className="flex-1 min-w-32 bg-transparent px-2 py-1 text-sm outline-none"
                        placeholder="أضف كلمة واضغط Enter"
                      />
                    </div>
                  </Field>
                  <Field label="ملاحظات إضافية" className="sm:col-span-2">
                    <textarea
                      className="input min-h-24"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="أي تفاصيل إضافية تساعد في التعرف"
                    />
                  </Field>
                </div>
              )}`;

if (content.includes('تفاصيل البلاغ')) {
  content = content.replace(oldFieldsStr, newFieldsStr);
}

// 2. Remove the old Humanitarian Toggle in Review step
// It starts with {/* Humanitarian Emergency Toggle & Form (Plan 2) */} and ends before {/* Secret Verification Mark Section (Plan 1) */}
const regex = /\{\/\* Humanitarian Emergency Toggle \& Form \(Plan 2\) \*\/\}[\s\S]*?(?=\{\/\* Secret Verification Mark Section \(Plan 1\) \*\/})/g;
content = content.replace(regex, '');

// 3. Hide Secret Verification if isHumanitarian
const secretTarget = `{/* Secret Verification Mark Section (Plan 1) */}
              <div className="mt-6 rounded-2xl border-2 border-indigo-200`;

const secretNew = `{/* Secret Verification Mark Section (Plan 1) */}
              {!isHumanitarian && (
              <div className="mt-6 rounded-2xl border-2 border-indigo-200`;

content = content.replace(secretTarget, secretNew);

const secretTargetEnd = `                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row pt-6">`;

const secretNewEnd = `                )}
              </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row pt-6">`;

content = content.replace(secretTargetEnd, secretNewEnd);

fs.writeFileSync(file, content, 'utf8');
console.log("Successfully fixed review section.");
