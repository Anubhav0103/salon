const cron = require('node-cron');
const db = require('../config/database');
const { sendMail } = require('../utils/mailjet');

// --- 1. The Core Logic is now in its own function ---
const checkAndSendReminders = async () => {
    const now = new Date();
    console.log(`[${now.toLocaleString()}] Manually running reminder check...`);

    try {
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
};

// --- 2. The Scheduler now just calls that function ---
cron.schedule('*/15 * * * *', () => {
    console.log("Scheduled cron job is running...");
    checkAndSendReminders();
});

console.log('Cron job service initialized. Task is scheduled to run every 15 minutes.');

// --- 3. Export the core function so we can use it elsewhere ---
module.exports = { checkAndSendReminders };