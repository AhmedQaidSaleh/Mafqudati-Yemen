const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/routes/_authenticated/report.new.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
`type FormState = {
  title: string;
  category_id: number | null;
  color: string;
  governorate_id: number | null;
  district_id: number | null;
  location_text: string;
  incident_date: string;
  brand: string;
  keywords: string[];
  notes: string;
  secret_verification_mark: string;
  reward_amount: number | null;
  contact_preference: "in_app" | "phone" | "both";
  is_humanitarian: boolean;
  age: string;
  gender: string;
  clothes_description: string;
  health_condition: string;
  emergency_phone: string;
};`,
`type FormState = {
  title: string;
  category_id: number | null;
  color: string;
  governorate_id: number | null;
  district_id: number | null;
  location_text: string;
  incident_date: string;
  incident_time: string;
  brand: string;
  keywords: string[];
  notes: string;
  secret_verification_mark: string;
  reward_amount: number | null;
  contact_preference: "in_app" | "phone" | "both";
  is_humanitarian: boolean;
  human_category: "child" | "elderly" | "youth" | "";
  age: string;
  gender: string;
  clothes_description: string;
  speech_manner: string;
  health_status_quick: string;
  health_condition: string;
  special_instructions: string;
  emergency_phone: string;
  alt_emergency_phone: string;
};`
);

content = content.replace(
`    contact_preference: "in_app",
    is_humanitarian: false,
    age: "",
    gender: "",
    clothes_description: "",
    health_condition: "",
    emergency_phone: "",
  };`,
`    contact_preference: "in_app",
    is_humanitarian: false,
    human_category: "",
    age: "",
    gender: "",
    clothes_description: "",
    speech_manner: "",
    health_status_quick: "",
    health_condition: "",
    special_instructions: "",
    emergency_phone: "",
    alt_emergency_phone: "",
    incident_time: "",
  };`
);

fs.writeFileSync(file, content, 'utf8');
console.log("Updated FormState.");
