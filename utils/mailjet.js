const mailjet = require('node-mailjet');

const mj = mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_API_SECRET
);

function sendMail({ to, toName, subject, text, html }) {
    return mj.post('send', { version: 'v3.1' }).request({
        Messages: [
            {
                From: {
                    Email: process.env.MAILJET_FROM_EMAIL,
                    Name: process.env.MAILJET_FROM_NAME || 'Salon Booking'
                },
                To: [
                    {
                        Email: to,
                        Name: toName || to
                    }
                ],
                Subject: subject,
                TextPart: text,
                HTMLPart: html || text
            }
        ]
    });
}

module.exports = { sendMail }; 