import { z } from "zod";

export const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "الاسم قصير جداً").max(80),
  email: z.string().trim().email("بريد إلكتروني غير صالح").max(255),
  phone: z
    .string()
    .trim()
    .regex(/^\+?9677\d{8}$|^7\d{8}$|^\+?967\d{9}$/, "رقم جوال يمني غير صالح")
    .optional()
    .or(z.literal("")),
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل").max(128),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().trim().email("بريد إلكتروني غير صالح"),
  password: z.string().min(1, "أدخل كلمة المرور"),
});

export const resetRequestSchema = z.object({
  email: z.string().trim().email("بريد إلكتروني غير صالح"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل").max(128),
});

export const reportSchema = z.object({
  type: z.enum(["lost", "found"]),
  title: z.string().trim().min(4, "العنوان قصير").max(120),
  description: z.string().trim().min(10, "الوصف قصير").max(2000),
  category_id: z.coerce.number().int().positive("اختر التصنيف"),
  governorate_id: z.coerce.number().int().positive("اختر المحافظة"),
  district_id: z.coerce.number().int().positive().optional().nullable(),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  neighborhood: z.string().trim().max(120).optional().or(z.literal("")),
  lat: z.coerce.number().min(-90).max(90).optional().nullable(),
  lng: z.coerce.number().min(-180).max(180).optional().nullable(),
  incident_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ غير صالح"),
  contact_preference: z.enum(["in_app", "phone", "both"]),
  reward_amount: z.coerce.number().nonnegative().max(100000000).optional().nullable(),
});
export type ReportInput = z.infer<typeof reportSchema>;

export const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  governorate: z.string().trim().max(60).optional().or(z.literal("")),
  district: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  neighborhood: z.string().trim().max(120).optional().or(z.literal("")),
});

export const messageSchema = z.object({
  body: z.string().trim().min(1, "الرسالة فارغة").max(1000),
});
