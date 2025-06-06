const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
const fs = require("fs");

const serviceAccount = require("./firebaseServiceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

sgMail.setApiKey("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");

async function sendReminders() {
  const today = new Date().toLocaleString('en-US', { weekday: 'long', timeZone: 'UTC' });
  const usersSnapshot = await db.collection("users").get();

  console.log("Checking users...");

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    const email = data.email;
    const goals = data.practiceGoals;

    console.log(`👤 User: ${email}`);
    console.log(`📅 Practice days: ${goals?.selectedDays}`);
    console.log(`🕒 Today is: ${today}`);

    if (!email || !goals?.selectedDays?.includes(today)) {
      console.log("❌ Skipping user, no email or today not in selectedDays");
      continue;
    }

    const msg = {
      to: email,
      from: "craceadiana8@gmail.com",
      subject: "🎯 Time to Practice!",
      html: `
        <p>Hey there 🎶</p>
        <p>It's <strong>practice day</strong>! You picked today as one of your practice days, and we’re here to cheer you on! 🙌</p>
        <p>Here’s a quick look at your current goals:</p>
        <ul>
          <li><strong>Practice Duration:</strong> ${goals.duration} minutes</li>
          <li><strong>Weekly Goal:</strong> ${goals.timesPerWeek} sessions/week</li>
        </ul>
        <p>Even just a few focused minutes today can make a big difference.</p>
        <p><em>“The secret to getting ahead is getting started.”</em> – Mark Twain</p>
        <p>Keep the streak alive! You've got this! 💪🔥</p>
        <p>🎼<br>Your Practice Buddy</p>
      `

    };

    try {
      await sgMail.send(msg);
      console.log(`Sent reminder to ${email}`);
    } catch (err) {
      console.error(`Failed to send to ${email}:`, err);
    }
  }
}

sendReminders().then(() => process.exit());
