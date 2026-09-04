const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/routes/_authenticated/report.new.tsx');
let content = fs.readFileSync(file, 'utf8');

const targetCall = `<PreviewCard
            type={type}
            title={form.title}
            description={description}
            category={selectedCategory?.name_ar ?? null}
            governorate={selectedGov?.name_ar ?? null}
            district={selectedDist?.name_ar ?? null}
            location={form.location_text}
            incidentDate={form.incident_date}
            keywords={form.keywords}
            secretVerificationMark={form.secret_verification_mark}
            rewardAmount={form.reward_amount}
            images={images}
            isHumanitarian={isHumanitarian}
            age={form.age}
            gender={form.gender}
            clothesDescription={form.clothes_description}
            healthCondition={form.health_condition}
            emergencyPhone={form.emergency_phone}
          />`;

const newCall = `<PreviewCard
            type={type}
            title={form.title}
            description={description}
            category={selectedCategory?.name_ar ?? null}
            governorate={selectedGov?.name_ar ?? null}
            district={selectedDist?.name_ar ?? null}
            location={form.location_text}
            incidentDate={form.incident_date}
            incidentTime={form.incident_time}
            keywords={form.keywords}
            secretVerificationMark={form.secret_verification_mark}
            rewardAmount={form.reward_amount}
            images={images}
            isHumanitarian={isHumanitarian}
            humanCategory={form.human_category}
            age={form.age}
            gender={form.gender}
            clothesDescription={form.clothes_description}
            speechManner={form.speech_manner}
            healthCondition={form.health_status_quick + (form.health_condition ? ' - ' + form.health_condition : '')}
            specialInstructions={form.special_instructions}
            emergencyPhone={form.emergency_phone}
            altEmergencyPhone={form.alt_emergency_phone}
          />`;

content = content.replace(targetCall, newCall);
fs.writeFileSync(file, content, 'utf8');
console.log("Updated PreviewCard call.");
