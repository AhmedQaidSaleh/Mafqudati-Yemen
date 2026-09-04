export interface GovernorateData {
  id: number;
  name_ar: string;
  name_en: string;
}

export interface DistrictData {
  id: number;
  governorate_id: number;
  name_ar: string;
  name_en: string;
}

export interface CategoryData {
  id: number;
  slug: string;
  name_ar: string;
  name_en: string;
  icon?: string;
}

export const YEMEN_GOVERNORATES: GovernorateData[] = [
  { id: 1, name_ar: "أمانة العاصمة", name_en: "Amanat Al Asimah" },
  { id: 2, name_ar: "صنعاء", name_en: "Sana'a" },
  { id: 3, name_ar: "عدن", name_en: "Aden" },
  { id: 4, name_ar: "تعز", name_en: "Taiz" },
  { id: 5, name_ar: "الحديدة", name_en: "Al Hudaydah" },
  { id: 6, name_ar: "إب", name_en: "Ibb" },
  { id: 7, name_ar: "ذمار", name_en: "Dhamar" },
  { id: 8, name_ar: "حضرموت", name_en: "Hadhramaut" },
  { id: 9, name_ar: "مأرب", name_en: "Marib" },
  { id: 10, name_ar: "صعدة", name_en: "Saada" },
  { id: 11, name_ar: "حجة", name_en: "Hajjah" },
  { id: 12, name_ar: "المهرة", name_en: "Al Mahrah" },
  { id: 13, name_ar: "شبوة", name_en: "Shabwah" },
  { id: 14, name_ar: "أبين", name_en: "Abyan" },
  { id: 15, name_ar: "لحج", name_en: "Lahij" },
  { id: 16, name_ar: "الضالع", name_en: "Al Dhale'e" },
  { id: 17, name_ar: "عمران", name_en: "Amran" },
  { id: 18, name_ar: "البيضاء", name_en: "Al Bayda" },
  { id: 19, name_ar: "ريمة", name_en: "Raymah" },
  { id: 20, name_ar: "الجوف", name_en: "Al Jawf" },
  { id: 21, name_ar: "سقطرى", name_en: "Socotra" },
  { id: 22, name_ar: "المحويت", name_en: "Al Mahwit" },
];

export const YEMEN_DISTRICTS: DistrictData[] = [
  // 1: أمانة العاصمة
  { id: 101, governorate_id: 1, name_ar: "التحرير", name_en: "Al Tahrir" },
  { id: 102, governorate_id: 1, name_ar: "معين", name_en: "Ma'ain" },
  { id: 103, governorate_id: 1, name_ar: "السبعين", name_en: "Al Sabeen" },
  { id: 104, governorate_id: 1, name_ar: "الثورة", name_en: "Al Thawra" },
  { id: 105, governorate_id: 1, name_ar: "الصافية", name_en: "Al Safiyah" },
  { id: 106, governorate_id: 1, name_ar: "شعوب", name_en: "Shu'aub" },
  { id: 107, governorate_id: 1, name_ar: "بني الحارث", name_en: "Bani Al Harith" },
  { id: 108, governorate_id: 1, name_ar: "آزال", name_en: "Azal" },
  { id: 109, governorate_id: 1, name_ar: "صنعاء القديمة", name_en: "Old Sana'a" },
  { id: 110, governorate_id: 1, name_ar: "الوحدة", name_en: "Al Wahdah" },

  // 2: محافظة صنعاء
  { id: 201, governorate_id: 2, name_ar: "بني حشيش", name_en: "Bani Hushaysh" },
  { id: 202, governorate_id: 2, name_ar: "سنحان وبني بهلول", name_en: "Sanhan" },
  { id: 203, governorate_id: 2, name_ar: "همدان", name_en: "Hamdan" },
  { id: 204, governorate_id: 2, name_ar: "أرحب", name_en: "Arhab" },
  { id: 205, governorate_id: 2, name_ar: "بني مطر", name_en: "Bani Matar" },
  { id: 206, governorate_id: 2, name_ar: "الحيمة الداخلية", name_en: "Al Haymah Ad Dakhiliyah" },
  { id: 207, governorate_id: 2, name_ar: "الحيمة الخارجية", name_en: "Al Haymah Al Kharijiyah" },
  { id: 208, governorate_id: 2, name_ar: "خولان", name_en: "Khwlan" },
  { id: 209, governorate_id: 2, name_ar: "مناخة", name_en: "Manakhah" },
  { id: 210, governorate_id: 2, name_ar: "الطيال", name_en: "At Tyal" },

  // 3: عدن
  { id: 301, governorate_id: 3, name_ar: "كريتر (صيرة)", name_en: "Crater (Craiter)" },
  { id: 302, governorate_id: 3, name_ar: "المعلا", name_en: "Al Mualla" },
  { id: 303, governorate_id: 3, name_ar: "التواهي", name_en: "Al Tawahi" },
  { id: 304, governorate_id: 3, name_ar: "خور مكسر", name_en: "Khor Maksar" },
  { id: 305, governorate_id: 3, name_ar: "الشيخ عثمان", name_en: "Ash Shaikh Outhman" },
  { id: 306, governorate_id: 3, name_ar: "المنصورة", name_en: "Al Mansura" },
  { id: 307, governorate_id: 3, name_ar: "دار سعد", name_en: "Dar Sad" },
  { id: 308, governorate_id: 3, name_ar: "البريقة", name_en: "Al Buraiqeh" },

  // 4: تعز
  { id: 401, governorate_id: 4, name_ar: "القاهرة", name_en: "Al Qahirah" },
  { id: 402, governorate_id: 4, name_ar: "المظفر", name_en: "Al Mudhaffar" },
  { id: 403, governorate_id: 4, name_ar: "صالة", name_en: "Salah" },
  { id: 404, governorate_id: 4, name_ar: "صبر الموادم", name_en: "Sabir Al Mawadim" },
  { id: 405, governorate_id: 4, name_ar: "الشمايتين (التربة)", name_en: "Ash Shamayatayn" },
  { id: 406, governorate_id: 4, name_ar: "المخا", name_en: "Al Mukha" },
  { id: 407, governorate_id: 4, name_ar: "المعافر", name_en: "Al Ma'afer" },
  { id: 408, governorate_id: 4, name_ar: "المواسط", name_en: "Al Mawasit" },
  { id: 409, governorate_id: 4, name_ar: "جبل حبشي", name_en: "Jabal Habashy" },
  { id: 410, governorate_id: 4, name_ar: "شرعب الرونة", name_en: "Shar'ab Ar Rawnah" },
  { id: 411, governorate_id: 4, name_ar: "شرعب السلام", name_en: "Shar'ab As Salam" },
  { id: 412, governorate_id: 4, name_ar: "التعزية", name_en: "At Ta'iziyah" },

  // 5: الحديدة
  { id: 501, governorate_id: 5, name_ar: "الحوك", name_en: "Al Hawak" },
  { id: 502, governorate_id: 5, name_ar: "الميناء", name_en: "Al Mina" },
  { id: 503, governorate_id: 5, name_ar: "الحالي", name_en: "Al Hali" },
  { id: 504, governorate_id: 5, name_ar: "باجل", name_en: "Bajil" },
  { id: 505, governorate_id: 5, name_ar: "بيت الفقيه", name_en: "Bayt Al Faqih" },
  { id: 506, governorate_id: 5, name_ar: "زبيد", name_en: "Zabid" },
  { id: 507, governorate_id: 5, name_ar: "المنصورية", name_en: "Al Mansuriyah" },
  { id: 508, governorate_id: 5, name_ar: "المراوعة", name_en: "Al Marawi'ah" },
  { id: 509, governorate_id: 5, name_ar: "الدريهمي", name_en: "Ad Durayhimi" },
  { id: 510, governorate_id: 5, name_ar: "الخوخة", name_en: "Al Khawkhah" },
  { id: 511, governorate_id: 5, name_ar: "حيس", name_en: "Hays" },

  // 6: إب
  { id: 601, governorate_id: 6, name_ar: "الظهار", name_en: "Adh Dhihar" },
  { id: 602, governorate_id: 6, name_ar: "المشنة", name_en: "Al Mashannah" },
  { id: 603, governorate_id: 6, name_ar: "جبلة", name_en: "Jiblah" },
  { id: 604, governorate_id: 6, name_ar: "يريم", name_en: "Yarim" },
  { id: 605, governorate_id: 6, name_ar: "النادرة", name_en: "An Nadirah" },
  { id: 606, governorate_id: 6, name_ar: "السدة", name_en: "As Saddah" },
  { id: 607, governorate_id: 6, name_ar: "العدين", name_en: "Al Udayn" },
  { id: 608, governorate_id: 6, name_ar: "حبيش", name_en: "Hubaysh" },
  { id: 609, governorate_id: 6, name_ar: "بعدان", name_en: "Ba'dan" },
  { id: 610, governorate_id: 6, name_ar: "القفر", name_en: "Al Qafr" },

  // 7: ذمار
  { id: 701, governorate_id: 7, name_ar: "مدينة ذمار", name_en: "Dhamar City" },
  { id: 702, governorate_id: 7, name_ar: "عنس", name_en: "Ans" },
  { id: 703, governorate_id: 7, name_ar: "ميفعة عنس", name_en: "Mayfa'at Anss" },
  { id: 704, governorate_id: 7, name_ar: "الحداء", name_en: "Al Hada" },
  { id: 705, governorate_id: 7, name_ar: "جبل الشرق", name_en: "Jabal Ash sharq" },
  { id: 706, governorate_id: 7, name_ar: "ضوران آنس", name_en: "Dawran Aness" },
  { id: 707, governorate_id: 7, name_ar: "عتمة", name_en: "Utmah" },
  { id: 708, governorate_id: 7, name_ar: "وصاب العالي", name_en: "Wusab Al Ali" },
  { id: 709, governorate_id: 7, name_ar: "وصاب السافل", name_en: "Wusab As Safil" },

  // 8: حضرموت
  { id: 801, governorate_id: 8, name_ar: "المكلا", name_en: "Al Mukalla" },
  { id: 802, governorate_id: 8, name_ar: "سيئون", name_en: "Say'un" },
  { id: 803, governorate_id: 8, name_ar: "الشحر", name_en: "Ash Shihr" },
  { id: 804, governorate_id: 8, name_ar: "تريم", name_en: "Tarim" },
  { id: 805, governorate_id: 8, name_ar: "شبام", name_en: "Shibam" },
  { id: 806, governorate_id: 8, name_ar: "القطن", name_en: "Al Qatn" },
  { id: 807, governorate_id: 8, name_ar: "دوعن", name_en: "Daw'an" },
  { id: 808, governorate_id: 8, name_ar: "غيل باوزير", name_en: "Ghayl Ba Wazir" },
  { id: 809, governorate_id: 8, name_ar: "الريدة وقصيعر", name_en: "Ar Raydah Wa Qusayar" },

  // 9: مأرب
  { id: 901, governorate_id: 9, name_ar: "مدينة مأرب", name_en: "Marib City" },
  { id: 902, governorate_id: 9, name_ar: "مأرب الوادي", name_en: "Marib Al Wadi" },
  { id: 903, governorate_id: 9, name_ar: "صرواح", name_en: "Sirwah" },
  { id: 904, governorate_id: 9, name_ar: "الجوبة", name_en: "Al Jubah" },
  { id: 905, governorate_id: 9, name_ar: "حريب", name_en: "Harib" },
  { id: 906, governorate_id: 9, name_ar: "العبدية", name_en: "Al Abdiyah" },

  // 10: صعدة
  { id: 1001, governorate_id: 10, name_ar: "مدينة صعدة", name_en: "Sa'ada City" },
  { id: 1002, governorate_id: 10, name_ar: "سحار", name_en: "Sahar" },
  { id: 1003, governorate_id: 10, name_ar: "الصفراء", name_en: "As Safra" },
  { id: 1004, governorate_id: 10, name_ar: "حيدان", name_en: "Haydan" },
  { id: 1005, governorate_id: 10, name_ar: "رازح", name_en: "Razih" },
  { id: 1006, governorate_id: 10, name_ar: "كتاف والبقع", name_en: "Kitaf wa Al Boqe'e" },

  // 11: حجة
  { id: 1101, governorate_id: 11, name_ar: "مدينة حجة", name_en: "Hajjah City" },
  { id: 1102, governorate_id: 11, name_ar: "عبس", name_en: "Abs" },
  { id: 1103, governorate_id: 11, name_ar: "حرض", name_en: "Harad" },
  { id: 1104, governorate_id: 11, name_ar: "المحابشة", name_en: "Al Mahabishah" },
  { id: 1105, governorate_id: 11, name_ar: "كحلان عفار", name_en: "Kuhlan Affar" },

  // 12: المهرة
  { id: 1201, governorate_id: 12, name_ar: "الغيضة", name_en: "Al Ghaydah" },
  { id: 1202, governorate_id: 12, name_ar: "حوف", name_en: "Hawf" },
  { id: 1203, governorate_id: 12, name_ar: "قشن", name_en: "Qishn" },
  { id: 1204, governorate_id: 12, name_ar: "سيحوت", name_en: "Sayhut" },
  { id: 1205, governorate_id: 12, name_ar: "شحن", name_en: "Shahan" },

  // 13: شبوة
  { id: 1301, governorate_id: 13, name_ar: "عتق", name_en: "Ataq" },
  { id: 1302, governorate_id: 13, name_ar: "بيحان", name_en: "Bayhan" },
  { id: 1303, governorate_id: 13, name_ar: "حبان", name_en: "Habban" },
  { id: 1304, governorate_id: 13, name_ar: "عسيلان", name_en: "Usaylan" },
  { id: 1305, governorate_id: 13, name_ar: "ميفعة", name_en: "Mayfa'a" },

  // 14: أبين
  { id: 1401, governorate_id: 14, name_ar: "زنجبار", name_en: "Zinjibar" },
  { id: 1402, governorate_id: 14, name_ar: "خنفر (جعار)", name_en: "Khanfir (Ja'ar)" },
  { id: 1403, governorate_id: 14, name_ar: "لودر", name_en: "Lawdar" },
  { id: 1404, governorate_id: 14, name_ar: "مودية", name_en: "Mudiyah" },
  { id: 1405, governorate_id: 14, name_ar: "أحور", name_en: "Ahwar" },

  // 15: لحج
  { id: 1501, governorate_id: 15, name_ar: "الحوطة", name_en: "Al Hawtah" },
  { id: 1502, governorate_id: 15, name_ar: "تبن", name_en: "Tuban" },
  { id: 1503, governorate_id: 15, name_ar: "ردفان (الحبيلين)", name_en: "Radfan" },
  { id: 1504, governorate_id: 15, name_ar: "يافع لبعوس", name_en: "Yafa'a Lab'ous" },
  { id: 1505, governorate_id: 15, name_ar: "طور الباحة", name_en: "Tawr Al Bahah" },

  // 16: الضالع
  { id: 1601, governorate_id: 16, name_ar: "مدينة الضالع", name_en: "Ad Dhale'e City" },
  { id: 1602, governorate_id: 16, name_ar: "قعطبة", name_en: "Qatabah" },
  { id: 1603, governorate_id: 16, name_ar: "دمت", name_en: "Damt" },
  { id: 1604, governorate_id: 16, name_ar: "الحصين", name_en: "Al Hussein" },
  { id: 1605, governorate_id: 16, name_ar: "الشعيب", name_en: "Ash Shu'ayb" },

  // 17: عمران
  { id: 1701, governorate_id: 17, name_ar: "مدينة عمران", name_en: "Amran City" },
  { id: 1702, governorate_id: 17, name_ar: "خمر", name_en: "Khamir" },
  { id: 1703, governorate_id: 17, name_ar: "حوث", name_en: "Huth" },
  { id: 1704, governorate_id: 17, name_ar: "ريدة", name_en: "Raydah" },
  { id: 1705, governorate_id: 17, name_ar: "ثلاء", name_en: "Thula" },

  // 18: البيضاء
  { id: 1801, governorate_id: 18, name_ar: "مدينة البيضاء", name_en: "Al Bayda City" },
  { id: 1802, governorate_id: 18, name_ar: "رداع", name_en: "Rada'a" },
  { id: 1803, governorate_id: 18, name_ar: "مكيراس", name_en: "Mukayras" },
  { id: 1804, governorate_id: 18, name_ar: "السوادية", name_en: "As Sawadiyah" },

  // 19: ريمة
  { id: 1901, governorate_id: 19, name_ar: "الجبين", name_en: "Al Jabin" },
  { id: 1902, governorate_id: 19, name_ar: "بلاد الطعام", name_en: "Bilad At Ta'am" },
  { id: 1903, governorate_id: 19, name_ar: "كسمة", name_en: "Kusmah" },
  { id: 1904, governorate_id: 19, name_ar: "السلفية", name_en: "As Salafiyah" },

  // 20: الجوف
  { id: 2001, governorate_id: 20, name_ar: "الحزم", name_en: "Al Hazm" },
  { id: 2002, governorate_id: 20, name_ar: "المتون", name_en: "Al Maton" },
  { id: 2003, governorate_id: 20, name_ar: "خب والشعف", name_en: "Khabb wa ash Sha'af" },
  { id: 2004, governorate_id: 20, name_ar: "برط العنان", name_en: "Bart Al Anan" },

  // 21: سقطرى
  { id: 2101, governorate_id: 21, name_ar: "حديبو", name_en: "Hadibu" },
  {
    id: 2102,
    governorate_id: 21,
    name_ar: "قلنسية وعبد الكوري",
    name_en: "Qulensya Wa Abd Al Kuri",
  },

  // 22: المحويت
  { id: 2201, governorate_id: 22, name_ar: "مدينة المحويت", name_en: "Al Mahwit City" },
  { id: 2202, governorate_id: 22, name_ar: "شبام كوكبان", name_en: "Shibam Kawkaban" },
  { id: 2203, governorate_id: 22, name_ar: "الطويلة", name_en: "At Tawilah" },
  { id: 2204, governorate_id: 22, name_ar: "الرجم", name_en: "Ar Rujum" },
];

export const DEFAULT_CATEGORIES: CategoryData[] = [
  {
    id: 1,
    slug: "electronics",
    name_ar: "إلكترونيات وأجهزة",
    name_en: "Electronics",
    icon: "Laptop",
  },
  {
    id: 2,
    slug: "documents",
    name_ar: "وثائق ومستندات وبطاقات",
    name_en: "Documents & IDs",
    icon: "FileText",
  },
  {
    id: 3,
    slug: "wallets-bags",
    name_ar: "محافظ وحقائب",
    name_en: "Wallets & Bags",
    icon: "Briefcase",
  },
  { id: 4, slug: "keys", name_ar: "مفاتيح وسويتشات", name_en: "Keys", icon: "Key" },
  {
    id: 5,
    slug: "jewelry-watches",
    name_ar: "مجوهرات وساعات",
    name_en: "Jewelry & Watches",
    icon: "Watch",
  },
  { id: 6, slug: "vehicles", name_ar: "مركبات ودراجات", name_en: "Vehicles & Bikes", icon: "Car" },
  { id: 7, slug: "pets", name_ar: "حيوانات أليفة وطيور", name_en: "Pets & Birds", icon: "Dog" },
  {
    id: 8,
    slug: "personal-items",
    name_ar: "مقتنيات شخصية أخرى",
    name_en: "Other Personal Items",
    icon: "Package",
  },
  {
    id: 9,
    slug: "missing-persons",
    name_ar: "أشخاص وأطفال مفقودون",
    name_en: "Missing Persons & Children",
    icon: "UserX",
  },
];
