import { Resend } from 'resend';

interface TeamInvitationEmailData {
  email: string;
  teamName: string;
  inviterName: string;
  invitationId: string;
  role: string;
}

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key_for_development');

export class EmailService {

  /**
   * Send team invitation email using Resend
   */
  static async sendTeamInvitationEmail(data: TeamInvitationEmailData): Promise<void> {
    try {
      const { email, teamName, inviterName, invitationId, role } = data;

      // Base URL from environment or default
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const acceptUrl = `${baseUrl}/invitations/accept?id=${invitationId}`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .button:hover { background-color: #4338ca; }
              .info-box { background-color: white; padding: 15px; border-left: 4px solid #4f46e5; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Team Invitation</h1>
              </div>
              <div class="content">
                <h2>You've been invited to join a team!</h2>
                <p>Hi there,</p>
                <p><strong>${inviterName}</strong> has invited you to join the team <strong>${teamName}</strong> as a <strong>${role}</strong>.</p>
                
                <div class="info-box">
                  <p><strong>Team:</strong> ${teamName}</p>
                  <p><strong>Role:</strong> ${role}</p>
                  <p><strong>Invited by:</strong> ${inviterName}</p>
                </div>

                <p>Click the button below to accept the invitation and start collaborating:</p>
                
                <div style="text-align: center;">
                  <a href="${acceptUrl}" class="button">Accept Invitation</a>
                </div>

                <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                  Or copy and paste this link into your browser:<br>
                  <a href="${acceptUrl}" style="color: #4f46e5; word-break: break-all;">${acceptUrl}</a>
                </p>

                <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                  This invitation will expire in 7 days. If you don't want to join this team, you can safely ignore this email.
                </p>
              </div>
              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      // Send email using Resend
      const { data: emailData, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Team App <onboarding@resend.dev>',
        to: email,
        subject: `You've been invited to join ${teamName}`,
        html: htmlContent,
      });

      if (error) {
        throw error;
      }

      console.log('[EmailService] Team invitation email sent via Resend:', {
        emailId: emailData?.id,
        to: email,
        teamName,
        role,
      });
    } catch (error) {
      console.error('[EmailService] Failed to send invitation email via Resend:', error);
      // Don't throw - email sending should not block invitation creation
      // In production, you might want to add to a retry queue
    }
  }

}
