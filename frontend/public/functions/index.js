const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailEmail,
        pass: gmailPassword
    }
});

exports.sendPasswordEmail = functions.https.onRequest((req, res) => {
    const { email, password } = req.body;

    const mailOptions = {
        from: gmailEmail,
        to: email,
        subject: 'Bem-vindo ao Sistema de Gestão de Horários',
        text: `Olá,\n\nSua conta foi criada no Sistema de Gestão de Horários.\n\nEmail: ${email}\nSenha: ${password}\n\nPor favor, faça login e altere sua senha na página de Definições.\n\nAtenciosamente,\nEquipe SGH`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Erro ao enviar email:', error);
            res.status(500).send('Erro ao enviar email');
        } else {
            console.log('Email enviado:', info.response);
            res.status(200).send('Email enviado');
        }
    });
});