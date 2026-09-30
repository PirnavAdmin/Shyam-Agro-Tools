using MailKit.Net.Smtp;
using MimeKit;
using ShyamAgroSuite.Api.Services.Interfaces;

namespace ShyamAgroSuite.Api.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendOtpEmailAsync(string email, string otp)
        {
            var message = new MimeMessage();

            message.From.Add(
                MailboxAddress.Parse(
                    _configuration["EmailSettings:SenderEmail"]));

            message.To.Add(MailboxAddress.Parse(email));

            message.Subject = "Shyam Agro Tools - Admin Login OTP";

            var bodyBuilder = new BodyBuilder();

            bodyBuilder.HtmlBody = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='UTF-8'>
            </head>

            <body style='margin:0;padding:0;
                         background-color:#f4f4f4;
                         font-family:Arial,sans-serif;'>

                <table width='100%' cellpadding='0' cellspacing='0'>
                    <tr>
                        <td align='center'>

                            <table width='700'
                                   cellpadding='0'
                                   cellspacing='0'
                                   style='background:#ffffff;
                                          border-radius:12px;
                                          overflow:hidden;
                                          margin-top:20px;
                                          box-shadow:0px 0px 10px #cccccc;'>

                                <!-- Header -->
                                <tr>
                                    <td style='background:linear-gradient(90deg,#1B5E20,#4CAF50);
                                               padding:30px;
                                               text-align:center;'>

                                        <h1 style='color:#ffffff;
                                                   margin:0;
                                                   font-size:42px;'>
                                            SHYAM AGRO TOOLS
                                        </h1>

                                        <p style='color:#ffffff;
                                                  margin-top:10px;
                                                  font-size:18px;'>
                                            Admin Login Verification
                                        </p>
                                    </td>
                                </tr>

                                <!-- Content -->
                                <tr>
                                    <td style='padding:40px;'>

                                        <h2 style='color:#2E7D32;
                                                   text-align:center;'>
                                            Admin Login Verification
                                        </h2>

                                        <p style='font-size:18px;
                                                  color:#333;'>
                                            Hello Admin,
                                        </p>

                                        <p style='font-size:18px;
                                                  color:#333;'>
                                            Your OTP for Admin login to
                                            <b>Shyam Agro Tools</b> is:
                                        </p>

                                        <!-- OTP Box -->
                                        <table width='100%'
                                               cellpadding='0'
                                               cellspacing='0'>
                                            <tr>
                                                <td align='center'
                                                    style='padding:30px 0;'>

                                                    <div style='background:#F1F8E9;
                                                                border:2px dashed #4CAF50;
                                                                border-radius:10px;
                                                                padding:25px;
                                                                font-size:60px;
                                                                font-weight:bold;
                                                                color:#1B5E20;
                                                                letter-spacing:10px;'>

                                                        {otp}

                                                    </div>
                                                </td>
                                            </tr>
                                        </table>

                                        <p style='text-align:center;
                                                  color:#666;
                                                  font-size:16px;'>

                                            ⏰ This OTP is valid for
                                            <b>5 minutes only.</b>

                                        </p>

                                        <div style='background:#FFF8E1;
                                                    padding:18px;
                                                    border-radius:8px;
                                                    color:#444;
                                                    margin-top:20px;
                                                    text-align:center;'>

                                            🔒 Do not share this OTP with anyone.
                                            Shyam Agro Tools will never ask for your OTP.

                                        </div>

                                        <hr style='margin-top:35px;'>

                                        <p style='text-align:center;
                                                  color:#333;
                                                  font-size:18px;'>

                                            Thank you,<br>

                                            <b>Shyam Agro Tools Team</b>

                                        </p>

                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td style='background:#2E7D32;
                                               color:#ffffff;
                                               text-align:center;
                                               padding:20px;'>

                                        🌐 www.shyamagrotools.com &nbsp;&nbsp; | &nbsp;&nbsp;
                                        ✉ support@shyamagrotools.com &nbsp;&nbsp; | &nbsp;&nbsp;
                                        ☎ +91 7338272036

                                    </td>
                                </tr>

                            </table>

                        </td>
                    </tr>
                </table>

            </body>
            </html>";

            message.Body = bodyBuilder.ToMessageBody();

            using var smtp = new SmtpClient();

            await smtp.ConnectAsync(
                _configuration["EmailSettings:SmtpServer"],
                Convert.ToInt32(_configuration["EmailSettings:Port"]),
                MailKit.Security.SecureSocketOptions.StartTls);

            await smtp.AuthenticateAsync(
                _configuration["EmailSettings:SenderEmail"],
                _configuration["EmailSettings:Password"]);

            await smtp.SendAsync(message);

            await smtp.DisconnectAsync(true);
        }
    }
}