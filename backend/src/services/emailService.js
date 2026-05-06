const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVideoDenialEmail = async (userEmail, videoTitle, category, subcategory) => {
  const mailOptions = {
    from: `"SKILLX Support" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `Video Upload Denied: ${videoTitle}`,
    html: `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #ef4444;">Video Rejection Notification</h2>
        <p>Hello,</p>
        <p>We regret to inform you that your video titled "<strong>${videoTitle}</strong>" has been denied by our moderation team.</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Subcategory:</strong> ${subcategory}</p>
        </div>
        <p style="margin-top: 20px;">If you believe this was an error, you can re-upload your video ensuring it follows our community guidelines.</p>
        <p>Best regards,<br>The SKILLX Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Denial email sent to ${userEmail} for video: ${videoTitle}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const sendVideoApprovalEmail = async (userEmail, videoTitle) => {
  const mailOptions = {
    from: `"SKILLX Support" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `Congratulations! Your Video is Approved: ${videoTitle}`,
    html: `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #22c55e;">Video Approval Notification</h2>
        <p>Hello,</p>
        <p>Great news! Your video titled "<strong>${videoTitle}</strong>" has been approved and is now live in the Video Library.</p>
        <p>Users can now learn from your expertise, and you will earn credits for every unique view!</p>
        <p>Best regards,<br>The SKILLX Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Approval email sent to ${userEmail} for video: ${videoTitle}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const sendVideoPurchaseEmail = async (viewerEmail, videoTitle) => {
  const mailOptions = {
    from: `"SKILLX" <${process.env.EMAIL_USER}>`,
    to: viewerEmail,
    subject: `Purchase Successful: ${videoTitle}`,
    html: `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #818cf8;">Course Unlocked</h2>
        <p>Hello,</p>
        <p>You have successfully unlocked the course: "<strong>${videoTitle}</strong>".</p>
        <p><strong>1 Credit</strong> has been debited from your account.</p>
        <p>You can now watch this video anytime from your "My Videos" or the "Skill Gallery".</p>
        <p>Best regards,<br>The SKILLX Team</p>
      </div>
    `,
  };
  try { await transporter.sendMail(mailOptions); } catch (e) { console.error(e); }
};

const sendVideoSaleEmail = async (creatorEmail, videoTitle) => {
  const mailOptions = {
    from: `"SKILLX" <${process.env.EMAIL_USER}>`,
    to: creatorEmail,
    subject: `Elite Sale: Your Course was Purchased!`,
    html: `
      <div style="font-family: sans-serif; color: #333;">
        <h2 style="color: #D4AF37;">Credits Received</h2>
        <p>Hello,</p>
        <p>A user has just purchased your course: "<strong>${videoTitle}</strong>".</p>
        <p><strong>1 Credit</strong> has been credited to your balance.</p>
        <p>Keep up the great work in the SKILLX ecosystem!</p>
        <p>Best regards,<br>The SKILLX Team</p>
      </div>
    `,
  };
  try { await transporter.sendMail(mailOptions); } catch (e) { console.error(e); }
};

module.exports = {
  sendVideoDenialEmail,
  sendVideoApprovalEmail,
  sendVideoPurchaseEmail,
  sendVideoSaleEmail
};
