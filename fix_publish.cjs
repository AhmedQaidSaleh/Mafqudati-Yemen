const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/routes/_authenticated/report.new.tsx');
let content = fs.readFileSync(file, 'utf8');

const targetCall = `        is_humanitarian: isHumanitarian,
        age: isHumanitarian ? form.age.trim() || null : null,
        gender: isHumanitarian ? form.gender.trim() || null : null,
        clothes_description: isHumanitarian ? form.clothes_description.trim() || null : null,
        health_condition: isHumanitarian ? form.health_condition.trim() || null : null,
        emergency_phone: isHumanitarian ? form.emergency_phone.trim() || null : null,`;

const newCall = `        is_humanitarian: isHumanitarian,
        age: isHumanitarian ? form.age.trim() || null : null,
        gender: isHumanitarian ? form.gender.trim() || null : null,
        clothes_description: isHumanitarian ? form.clothes_description.trim() || null : null,
        health_condition: isHumanitarian ? 
          [form.health_status_quick, form.health_condition].filter(Boolean).join(" - ") || null : null,
        emergency_phone: isHumanitarian ? 
          [form.emergency_phone.trim(), form.alt_emergency_phone.trim()].filter(Boolean).join(" / ") || null : null,
        notes: isHumanitarian ? 
          [\`الفئة: \${form.human_category}\`, 
           \`التخاطب: \${form.speech_manner}\`, 
           \`تعليمات خاصة: \${form.special_instructions}\`,
           \`وقت الاختفاء: \${form.incident_time}\`].filter(s => !s.endsWith("undefined") && !s.endsWith(":") && s.trim().length > 10).join("\\n") 
          : (form.notes.trim() || null),`;

content = content.replace(targetCall, newCall);
fs.writeFileSync(file, content, 'utf8');
console.log("Updated Publish function.");
