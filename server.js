require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (your website)
app.use(express.static(path.join(__dirname)));

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT, // Usually 465 for SSL or 587 for TLS
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify email connection
transporter.verify(function(error, success) {
    if (error) {
        console.error("Email configuration error:", error);
    } else {
        console.log("Server is ready to send messages");
    }
});

// Contact Route API
app.post('/api/contact', async (req, res) => {
    try {
        const { name, organization, email, phone, message, captchaResult, captchaExpected } = req.body;

        // Basic server-side validation
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Bitte füllen Sie alle Pflichtfelder aus.' });
        }

        // Validate Captcha
        if (String(captchaResult) !== String(captchaExpected)) {
            return res.status(400).json({ success: false, message: 'Captcha war leider inkorrekt. Bitte erneut versuchen.' });
        }

        // Email to Info (lml-med)
        const mailToAdmin = {
            from: `"LML-MED Website" <${process.env.EMAIL_USER}>`,
            to: process.env.RECIPIENT_EMAIL || 'info@lml-med.de',
            replyTo: email,
            subject: `Neue Kontaktanfrage von ${name}`,
            text: `
Neue Kontaktanfrage über lml-med.de:

Name: ${name}
Organisation: ${organization || '-'}
E-Mail: ${email}
Telefon: ${phone || '-'}

Nachricht:
${message}
            `,
            html: `
<h3>Neue Kontaktanfrage über lml-med.de</h3>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Organisation:</strong> ${organization || '-'}</p>
<p><strong>E-Mail:</strong> ${email}</p>
<p><strong>Telefon:</strong> ${phone || '-'}</p>
<br>
<p><strong>Nachricht:</strong></p>
<p>${message.replace(/\n/g, '<br>')}</p>
            `
        };

        // Confirmation Email to the user
        const mailToUser = {
            from: `"Laurin Lobeck | LML-MED" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Vielen Dank für Ihre Anfrage`,
            text: `
Guten Tag ${name},

vielen Dank für Ihre Nachricht! Ich habe Ihre Kontaktaufnahme erhalten und werde mich schnellstmöglich bei Ihnen melden. 

Zur Kontrolle hier noch einmal Ihre Angaben:

Name: ${name}
Organisation: ${organization || '-'}
E-Mail: ${email}
Telefon: ${phone || '-'}

Ihre Nachricht:
${message}

Beste Grüße
Laurin Lobeck
LML-MED
            `,
            html: `
<p>Guten Tag ${name},</p>
<p>vielen Dank für Ihre Nachricht! Ich habe Ihre Kontaktaufnahme erhalten und werde mich schnellstmöglich bei Ihnen melden.</p>
<br>
<p>Zur Kontrolle hier noch einmal Ihre Angaben:</p>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Organisation:</strong> ${organization || '-'}</p>
<p><strong>E-Mail:</strong> ${email}</p>
<p><strong>Telefon:</strong> ${phone || '-'}</p>
<br>
<p><strong>Ihre Nachricht:</strong></p>
<p>${message.replace(/\n/g, '<br>')}</p>
<br>
<br>
<p>Beste Grüße</p>
<p>Laurin Lobeck<br>LML-MED</p>
            `
        };

        // Send both emails
        await transporter.sendMail(mailToAdmin);
        await transporter.sendMail(mailToUser);

        res.status(200).json({ success: true, message: 'Nachricht erfolgreich gesendet!' });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ success: false, message: 'Es gab ein Problem beim Senden der E-Mail. Bitte versuchen Sie es später noch einmal.' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
