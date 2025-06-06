import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';
import { pubsub } from 'firebase-functions';

admin.initializeApp();
const db = admin.firestore();
// 🔐 Set your SendGrid API Key in Firebase config
sgMail.setApiKey(functions.config().sendgrid.key);

export const sendPracticeReminders = functions.pubsub
  .schedule('every day 08:00')
  .timeZone('Etc/UTC')
  .onRun(async (context) => {
    const usersSnapshot = await db.collection('users').get();

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const email = userData.email;
      const practiceGoals = userData.practiceGoals;

      if (!email || !practiceGoals?.selectedDays?.length) continue;

      const today = new Date().toLocaleString('en-US', { weekday: 'long', timeZone: 'UTC' });

      if (practiceGoals.selectedDays.includes(today)) {
        const msg = {
          to: email,
          from: 'your@email.com', // Verified sender on SendGrid
          subject: 'Time to Practice! 🎯',
          text: `Hi there! Just a reminder to complete your practice session today.\n\nGoal: ${practiceGoals.duration} minutes\nYou're on track for ${practiceGoals.timesPerWeek} days/week!`,
          html: `<strong>Hi there!</strong><br><br>Just a friendly reminder to complete your practice today.<br><ul><li><b>Goal:</b> ${practiceGoals.duration} minutes</li><li><b>Target days/week:</b> ${practiceGoals.timesPerWeek}</li></ul><br>Keep going! 🔥`,
        };

        try {
          await sgMail.send(msg);
          console.log(`Email sent to ${email}`);
        } catch (error) {
          console.error(`Failed to send to ${email}:`, error);
        }
      }
    }

    return null;
  });
