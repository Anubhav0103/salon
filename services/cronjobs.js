const cron = require('node-cron');
const db = require('../config/database');
const { sendMail } = require('../utils/mailjet');

console.log('Cron job service initialized.');

// Schedule a task to run every 15 minutes.
// The syntax is: (minute hour day-of-month month day-of-week)
// '*/15 * * * *' means "at every 15th minute"
cron.schedule('*/15 * * * *', async () => {
    const now = new Date();
    console.log(`[${now.toLocaleString()}] Running cron job: Checking for booking reminders...`);

    try {
        // --- The Core Logic ---
        // 1. Find all bookings that are:
        //    - Occurring between 3 hours from now and 3 hours and 15 minutes from now.
        //      (The 15-minute window prevents missing a booking if the cron job runs a bit late).
        //    - Still in 'pending' status.
        //    - Have NOT had a reminder sent yet.
        const sql = `
            SELECT * FROM bookings 
            WHERE 
                TIMESTAMP(booking_date, booking_time) 
                BETWEEN NOW() + INTERVAL 3 HOUR AND NOW() + INTERVAL 3 HOUR + INTERVAL 15 MINUTE
            AND status = 'pending'
            AND reminder_sent = FALSE
        `;

        db.query(sql, async (err, bookings) => {
            if (err) {
                console.error("Cron job database query error:", err);
                return;
            }

            if (bookings.length === 0) {
                console.log("No bookings found that need a reminder in this interval.");
                return;
            }

            console.log(`Found ${bookings.length} booking(s) to remind.`);

            // 2. Loop through each booking and send an email.
            for (const booking of bookings) {
                try {
                    console.log(`Sending reminder for booking ID: ${booking.booking_id} to ${booking.user_email}`);
                    
                    await sendMail({
                        to: booking.user_email,
                        toName: booking.user_name,
                        subject: `Reminder: Your Appointment for ${booking.service_name}`,
                        text: `Dear ${booking.user_name},\n\nThis is a friendly reminder for your upcoming appointment for ${booking.service_name} today at ${booking.booking_time}.\n\nWe look forward to seeing you soon!`,
                        html: `<p>Dear ${booking.user_name},</p><p>This is a friendly reminder for your upcoming appointment for <b>${booking.service_name}</b> today at <b>${booking.booking_time}</b>.</p><p>We look forward to seeing you soon!</p>`
                    });

                    // 3. IMPORTANT: Mark the reminder as sent in the database.
                    const updateSql = "UPDATE bookings SET reminder_sent = TRUE WHERE booking_id = ?";
                    db.query(updateSql, [booking.booking_id]);
                    console.log(`Successfully sent reminder and marked booking ID: ${booking.booking_id}`);

                } catch (emailError) {
                    console.error(`Failed to send reminder for booking ID ${booking.booking_id}:`, emailError);
                }
            }
        });

    } catch (error) {
        console.error("An unexpected error occurred in the cron job:", error);
    }
});