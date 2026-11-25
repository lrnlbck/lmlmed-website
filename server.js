require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security helpers
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const rateLimitMap = new Map();
function contactRateLimit(req, res, next) {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const entry = rateLimitMap.get(ip) || { count: 0, start: now };
    if (now - entry.start > windowMs) {
        entry.count = 0;
        entry.start = now;
    }
    entry.count += 1;
    rateLimitMap.set(ip, entry);
    if (entry.count > 10) {
        return res.status(429).json({ success: false, message: 'Zu viele Anfragen. Bitte später erneut versuchen.' });
    }
    next();
}

// Restrict CORS to production domain & local dev
app.use(cors({
    origin: ['https://lml-med.de', 'http://localhost:3000']
}));
app.use(bodyParser.json({ limit: '32kb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '32kb' }));

// Block access to sensitive/server files before static middleware
app.use((req, res, next) => {
    const blocked = /^\/(\.|server\.js|package(-lock)?\.json|node_modules)/i;
    if (blocked.test(req.path)) {
        return res.status(403).send('Forbidden');
    }
    next();
});

// Serve static website files
app.use(express.static(path.join(__dirname), { dotfiles: 'deny' }));

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify((error) => {
    if (error) {
        console.error('Email configuration error:', error.message);
    } else {
        console.log('Server is ready to send messages');
    }
});

// Contact Route API
app.post('/api/contact', contactRateLimit, async (req, res) => {
    try {
        const { name, organization, email, phone, message, captchaResult, captchaExpected } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Bitte füllen Sie alle Pflichtfelder aus.' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(email)) || String(name).length > 120 || String(message).length > 4000) {
            return res.status(400).json({ success: false, message: 'Ungültige Eingabedaten.' });
        }

        if (String(captchaResult) !== String(captchaExpected)) {
            return res.status(400).json({ success: false, message: 'Captcha war leider inkorrekt. Bitte erneut versuchen.' });
        }

        const safeName = escapeHtml(name);
        const safeOrg = escapeHtml(organization || '-');
        const safeEmail = escapeHtml(email);
        const safePhone = escapeHtml(phone || '-');
        const safeMessageHtml = escapeHtml(message).replace(/\n/g, '<br>');

        const mailToAdmin = {
            from: `"LML-MED Website" <${process.env.EMAIL_USER}>`,
            to: process.env.RECIPIENT_EMAIL || 'info@lml-med.de',
            replyTo: String(email).replace(/[\r\n]/g, ''),
            subject: `Neue Kontaktanfrage von ${String(name).replace(/[\r\n]/g, '')}`,
            text: `Neue Kontaktanfrage über lml-med.de:\n\nName: ${name}\nOrganisation: ${organization || '-'}\nE-Mail: ${email}\nTelefon: ${phone || '-'}\n\nNachricht:\n${message}`,
            html: `<h3>Neue Kontaktanfrage über lml-med.de</h3><p><strong>Name:</strong> ${safeName}</p><p><strong>Organisation:</strong> ${safeOrg}</p><p><strong>E-Mail:</strong> ${safeEmail}</p><p><strong>Telefon:</strong> ${safePhone}</p><br><p><strong>Nachricht:</strong></p><p>${safeMessageHtml}</p>`
        };

        const mailToUser = {
            from: `"Laurin Lobeck | LML-MED" <${process.env.EMAIL_USER}>`,
            to: String(email).replace(/[\r\n]/g, ''),
            subject: 'Vielen Dank für Ihre Anfrage',
            text: `Guten Tag ${name},\n\nvielen Dank für Ihre Nachricht! Ich habe Ihre Kontaktaufnahme erhalten und werde mich schnellstmöglich bei Ihnen melden.\n\nBeste Grüße\nLaurin Lobeck\nLML-MED`,
            html: `<p>Guten Tag ${safeName},</p><p>vielen Dank für Ihre Nachricht! Ich habe Ihre Kontaktaufnahme erhalten und werde mich schnellstmöglich bei Ihnen melden.</p><br><p><strong>Ihre Nachricht:</strong></p><p>${safeMessageHtml}</p><br><p>Beste Grüße<br>Laurin Lobeck<br>LML-MED</p>`
        };

        await transporter.sendMail(mailToAdmin);
        await transporter.sendMail(mailToUser);

        res.status(200).json({ success: true, message: 'Nachricht erfolgreich gesendet!' });
    } catch (error) {
        console.error('Error sending email:', error.message);
        res.status(500).json({ success: false, message: 'Es gab ein Problem beim Senden der E-Mail. Bitte versuchen Sie es später noch einmal.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
